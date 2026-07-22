"""CellTrace — Battery Science & Degradation Physics RAG Knowledge Base."""
import re
from typing import List, Dict

# Curated Scientific Knowledge Base on Battery Physics, Degradation & APM
BATTERY_KNOWLEDGE_BASE: List[Dict[str, str]] = [
    {
        "topic": "Lithium Plating & Anode Degradation",
        "keywords": ["lithium plating", "plating", "dendrite", "anode", "fast charging", "overpotential", "c-rate"],
        "content": """Lithium Plating Mechanics: During high C-rate fast charging (>1.0C) or charging at low temperatures (<15°C), metallic lithium deposits directly onto the graphite anode surface instead of intercalating into the graphite host structure. This occurs when the anode potential drops below 0V vs Li/Li+. Metallic lithium reacts with electrolyte, consuming active lithium cyclically, causing rapid capacity fade and risk of internal short circuits due to lithium dendrite growth."""
    },
    {
        "topic": "SEI Layer Growth & Resistance Build-up",
        "keywords": ["sei", "solid electrolyte interphase", "sei layer", "impedance", "resistance", "electrolyte"],
        "content": """Solid Electrolyte Interphase (SEI) Dynamics: SEI layer grows continuously at the graphite-electrolyte interface due to parasitic electrolyte reduction reactions. SEI growth follows square-root-of-time (t^0.5) kinetics under nominal conditions, consuming cyclable lithium and increasing cell internal impedance. Elevated operating temperatures (>40°C) accelerate SEI dissolution and re-formation, speeding up capacity loss."""
    },
    {
        "topic": "Cathode Degradation (NMC vs LFP vs NCA)",
        "keywords": ["nmc", "lfp", "nca", "cathode", "chemistry", "microcracking", "manganese", "structure"],
        "content": """Cathode Material Degradation Comparison:
- NMC (Nickel Manganese Cobalt): High nickel content (e.g. NMC 811) offers superior energy density but suffers from anisotropic lattice expansion/contraction during deep cycling, leading to particle micro-cracking and transition metal dissolution.
- LFP (Lithium Iron Phosphate): Highly stable olivine crystal structure with minimal volume change (<7%), rendering high cycle life (>3000 cycles) and exceptional thermal safety up to 270°C.
- NCA (Nickel Cobalt Aluminum): High capacity but sensitive to thermal spikes and high SOC storage degradation."""
    },
    {
        "topic": "Knee-Point Phase Transition & Accelerated Fade",
        "keywords": ["knee point", "knee-point", "accelerated fade", "capacity drop", "phase transition", "rollover"],
        "content": """Knee-Point Mechanism: The knee-point marks a sharp non-linear transition in battery degradation, shifting capacity loss from slow linear decay to rapid exponential fade. The physical root cause is the transition from uniform SEI growth to localized severe lithium plating and porosity loss in the anode. Once a cell reaches its knee-point, remaining cycle life decreases by 60%-80% faster than linear projections."""
    },
    {
        "topic": "Thermal Runaway Precursors & Safety Limits",
        "keywords": ["thermal runaway", "temperature", "overheating", "hotspot", "combustion", "cooling"],
        "content": """Thermal Runaway Stages: 
Stage 1 (80°C - 120°C): SEI breakdown begins, triggering exothermic reactions with electrolyte.
Stage 2 (120°C - 140°C): Separator melts, causing localized micro-short circuits.
Stage 3 (>180°C): Cathode oxygen release causes violent self-sustaining thermal runaway.
APM Mitigation: Restrict peak temperatures below 45°C during high-power discharge and ensure liquid coolant delta T across pack remains under 3°C."""
    },
    {
        "topic": "Optimal Charging Protocols & Life Extension",
        "keywords": ["optimal charging", "charging profile", "soc window", "derating", "pulse charging", "life extension"],
        "content": """Battery Life Extension Strategies:
1. Restricted SOC Window (20% - 80%): Reduces mechanical lattice stress at high state-of-charge and prevents deep discharge copper dissolution below 2.0V.
2. Step-down C-Rate Throttling: High C-rate (1.5C) from 10%-50% SOC, derating to 0.8C from 50%-75% SOC, and 0.2C above 75% SOC prevents anode over-potential drop.
3. Thermal Pre-conditioning: Pre-cooling/heating pack to 22°C-25°C prior to fast charging minimizes impedance spikes and plating probability."""
    }
]


def retrieve_relevant_knowledge(query: str, max_chunks: int = 2) -> str:
    """Performs keyword similarity match against electro-chemical knowledge base."""
    query_lower = query.lower()
    scores = []

    for entry in BATTERY_KNOWLEDGE_BASE:
        score = 0
        for kw in entry["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', query_lower):
                score += 3
            elif kw in query_lower:
                score += 1
        if score > 0:
            scores.append((score, entry))

    # Sort by relevance score
    scores.sort(key=lambda x: x[0], reverse=True)
    
    if not scores:
        # Fallback to general SEI & Lithium Plating knowledge
        matched_entries = [BATTERY_KNOWLEDGE_BASE[0], BATTERY_KNOWLEDGE_BASE[1]]
    else:
        matched_entries = [item[1] for item in scores[:max_chunks]]

    context_text = "\n\n".join([f"=== Scientific Reference ({e['topic']}) ===\n{e['content']}" for e in matched_entries])
    return context_text
