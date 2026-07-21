"""CellTrace — Blockchain (web3.py) service for on-chain provenance writes/reads."""
import json
import logging
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger("celltrace.chain")

# BatteryProvenance ABI (minimal — only the functions we call)
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "batteryId", "type": "string"},
            {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"},
            {"internalType": "string", "name": "eventType", "type": "string"},
        ],
        "name": "addRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "string", "name": "batteryId", "type": "string"}],
        "name": "getRecordCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "string", "name": "batteryId", "type": "string"},
            {"internalType": "uint256", "name": "index", "type": "uint256"},
        ],
        "name": "getRecord",
        "outputs": [
            {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "string", "name": "eventType", "type": "string"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "string", "name": "batteryId", "type": "string"}],
        "name": "getAllRecords",
        "outputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "string", "name": "eventType", "type": "string"},
                ],
                "internalType": "struct BatteryProvenance.Record[]",
                "name": "",
                "type": "tuple[]",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
]


class ChainService:
    """Interacts with the BatteryProvenance smart contract on Polygon Amoy."""

    def __init__(self):
        self._web3 = None
        self._contract = None
        self._account = None
        self._initialized = False

    def _ensure_init(self):
        """Lazy-initialize web3 connection."""
        if self._initialized:
            return

        if not settings.AMOY_RPC_URL or not settings.PRIVATE_KEY or not settings.CONTRACT_ADDRESS:
            logger.warning("Blockchain config incomplete — chain features disabled")
            return

        try:
            from web3 import Web3
            from eth_account import Account

            self._web3 = Web3(Web3.HTTPProvider(settings.AMOY_RPC_URL))
            self._account = Account.from_key(settings.PRIVATE_KEY)
            self._contract = self._web3.eth.contract(
                address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
                abi=CONTRACT_ABI,
            )
            self._initialized = True
            logger.info(
                f"Chain service initialized — contract: {settings.CONTRACT_ADDRESS}, "
                f"operator: {self._account.address}"
            )
        except Exception as e:
            logger.error(f"Chain service init failed: {e}")

    @property
    def is_available(self) -> bool:
        self._ensure_init()
        return self._initialized and self._web3 is not None

    async def add_record(
        self, battery_id: str, data_hash: str, event_type: str
    ) -> Optional[dict]:
        """
        Write a provenance record on-chain.
        Returns: { tx_hash, block_number, status } or None on failure.
        """
        self._ensure_init()
        if not self.is_available:
            logger.warning("Chain service not available — skipping on-chain write")
            return None

        try:
            from web3 import Web3

            # Convert hex string hash to bytes32
            hash_bytes = bytes.fromhex(data_hash.replace("0x", ""))
            if len(hash_bytes) != 32:
                hash_bytes = hash_bytes.ljust(32, b"\x00")

            # Build transaction
            nonce = self._web3.eth.get_transaction_count(self._account.address)
            tx = self._contract.functions.addRecord(
                battery_id, hash_bytes, event_type
            ).build_transaction(
                {
                    "from": self._account.address,
                    "nonce": nonce,
                    "gas": 200000,
                    "gasPrice": self._web3.eth.gas_price,
                    "chainId": 80002,  # Polygon Amoy
                }
            )

            # Sign and send
            signed = self._web3.eth.account.sign_transaction(tx, self._account.key)
            tx_hash = self._web3.eth.send_raw_transaction(signed.raw_transaction)
            tx_hash_hex = tx_hash.hex()

            logger.info(f"Chain write sent — tx: {tx_hash_hex}, battery: {battery_id}")

            # Wait for receipt (with timeout)
            receipt = self._web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            return {
                "tx_hash": tx_hash_hex,
                "block_number": receipt.blockNumber,
                "status": "confirmed" if receipt.status == 1 else "failed",
                "gas_used": receipt.gasUsed,
            }

        except Exception as e:
            logger.error(f"Chain write failed for battery {battery_id}: {e}")
            return None

    async def get_all_records(self, battery_id: str) -> list[dict]:
        """Read all provenance records for a battery from the contract."""
        self._ensure_init()
        if not self.is_available:
            return []

        try:
            records = self._contract.functions.getAllRecords(battery_id).call()
            return [
                {
                    "data_hash": "0x" + record[0].hex(),
                    "timestamp": record[1],
                    "event_type": record[2],
                }
                for record in records
            ]
        except Exception as e:
            logger.error(f"Chain read failed for battery {battery_id}: {e}")
            return []

    async def get_record_count(self, battery_id: str) -> int:
        """Get the number of on-chain records for a battery."""
        self._ensure_init()
        if not self.is_available:
            return 0

        try:
            return self._contract.functions.getRecordCount(battery_id).call()
        except Exception as e:
            logger.error(f"Chain record count failed: {e}")
            return 0


# Singleton
chain_service = ChainService()
