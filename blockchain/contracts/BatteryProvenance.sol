// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title BatteryProvenance
/// @notice Minimal, hash-only on-chain provenance log for battery health records.
///         Only the contract owner (your backend's wallet) can write records —
///         this prevents anyone else from spamming fake provenance data onto
///         your battery IDs.
contract BatteryProvenance {
    address public owner;

    struct Record {
        bytes32 dataHash;   // hash of the off-chain prediction/health report
        uint256 timestamp;  // block timestamp when the record was written
        string eventType;   // e.g. "HEALTH_CHECK", "SOH_UPDATE", "OWNERSHIP_TRANSFER"
    }

    // batteryId (string, e.g. serial number) => list of records
    mapping(string => Record[]) private records;

    event RecordAdded(
        string indexed batteryId,
        bytes32 dataHash,
        string eventType,
        uint256 timestamp
    );

    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "BatteryProvenance: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnerChanged(address(0), msg.sender);
    }

    /// @notice Add a new provenance record for a battery.
    /// @param batteryId Identifier for the battery (e.g. serial number).
    /// @param dataHash Hash of the off-chain data (e.g. keccak256 of the prediction JSON).
    /// @param eventType Short label describing what kind of record this is.
    function addRecord(
        string calldata batteryId,
        bytes32 dataHash,
        string calldata eventType
    ) external onlyOwner {
        records[batteryId].push(Record({
            dataHash: dataHash,
            timestamp: block.timestamp,
            eventType: eventType
        }));

        emit RecordAdded(batteryId, dataHash, eventType, block.timestamp);
    }

    /// @notice Get the number of records stored for a battery.
    function getRecordCount(string calldata batteryId) external view returns (uint256) {
        return records[batteryId].length;
    }

    /// @notice Get a single record by index for a battery.
    function getRecord(string calldata batteryId, uint256 index)
        external
        view
        returns (bytes32 dataHash, uint256 timestamp, string memory eventType)
    {
        require(index < records[batteryId].length, "BatteryProvenance: index out of range");
        Record storage r = records[batteryId][index];
        return (r.dataHash, r.timestamp, r.eventType);
    }

    /// @notice Get all records for a battery at once (handy for a demo UI).
    function getAllRecords(string calldata batteryId) external view returns (Record[] memory) {
        return records[batteryId];
    }

    /// @notice Transfer write access to a new backend wallet, if needed.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BatteryProvenance: new owner is the zero address");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }
}
