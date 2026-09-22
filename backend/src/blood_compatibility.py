"""
AI Blood Supply Command Center - Blood Group Compatibility Engine
------------------------------------------------------------------
Clinical compatibility rules for Red Blood Cells, Plasma, Platelets, and Whole Blood.

Medical rules follow AABB and WHO transfusion guidelines:
1. Packed Red Blood Cells (RBC):
   - O- is the universal donor.
   - AB+ is the universal recipient.
   - Rh negative recipients must only receive Rh negative RBCs (to prevent anti-D alloimmunization).
   - Rh positive recipients can receive either Rh positive or Rh negative units.
2. Fresh Frozen Plasma (FFP):
   - ABO compatibility is inverted for plasma! AB plasma contains neither anti-A nor anti-B
     antibodies and is the universal plasma donor.
   - O plasma contains both anti-A and anti-B antibodies and is only transfused to group O.
3. Platelets:
   - Identical ABO/Rh is clinically preferred.
   - Cross-ABO platelets are permitted when identical stock is unavailable.
4. Whole Blood:
   - Strict ABO and Rh matching enforced.
"""

from typing import Dict, List, Set

# ---------------------------------------------------------------------------
# Red Blood Cell (RBC) Compatibility Matrix
# Key = Recipient Blood Group, Value = List of Compatible Donor Blood Groups
# ---------------------------------------------------------------------------
RBC_COMPATIBILITY: Dict[str, List[str]] = {
    "A_POS": ["A_POS", "A_NEG", "O_POS", "O_NEG"],
    "A_NEG": ["A_NEG", "O_NEG"],
    "B_POS": ["B_POS", "B_NEG", "O_POS", "O_NEG"],
    "B_NEG": ["B_NEG", "O_NEG"],
    "AB_POS": [
        "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"
    ],  # Universal Recipient
    "AB_NEG": ["AB_NEG", "A_NEG", "B_NEG", "O_NEG"],
    "O_POS": ["O_POS", "O_NEG"],
    "O_NEG": ["O_NEG"],  # Universal Donor (can only receive O_NEG)
}

# ---------------------------------------------------------------------------
# Whole Blood Compatibility Matrix
# Whole blood contains both RBCs and plasma; strict identical matching preferred,
# or safe RBC + safe plasma match.
# ---------------------------------------------------------------------------
WHOLE_BLOOD_COMPATIBILITY: Dict[str, List[str]] = {
    "A_POS": ["A_POS", "A_NEG"],
    "A_NEG": ["A_NEG"],
    "B_POS": ["B_POS", "B_NEG"],
    "B_NEG": ["B_NEG"],
    "AB_POS": ["AB_POS", "AB_NEG"],
    "AB_NEG": ["AB_NEG"],
    "O_POS": ["O_POS", "O_NEG"],
    "O_NEG": ["O_NEG"],
}

# ---------------------------------------------------------------------------
# Plasma (FFP) Compatibility Matrix
# Inverted ABO rules (antibodies are in plasma, antigens on recipient RBCs)
# ---------------------------------------------------------------------------
PLASMA_COMPATIBILITY: Dict[str, List[str]] = {
    "O_POS": ["O_POS", "O_NEG", "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG"],
    "O_NEG": ["O_POS", "O_NEG", "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG"],
    "A_POS": ["A_POS", "A_NEG", "AB_POS", "AB_NEG"],
    "A_NEG": ["A_POS", "A_NEG", "AB_POS", "AB_NEG"],
    "B_POS": ["B_POS", "B_NEG", "AB_POS", "AB_NEG"],
    "B_NEG": ["B_POS", "B_NEG", "AB_POS", "AB_NEG"],
    "AB_POS": ["AB_POS", "AB_NEG"],
    "AB_NEG": ["AB_POS", "AB_NEG"],
}

# ---------------------------------------------------------------------------
# Platelets Compatibility Matrix
# Clinically, ABO-identical is first-line; ABO-compatible plasma is second-line.
# ---------------------------------------------------------------------------
PLATELETS_COMPATIBILITY: Dict[str, List[str]] = {
    "A_POS": ["A_POS", "A_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"],
    "A_NEG": ["A_NEG", "AB_NEG", "O_NEG"],
    "B_POS": ["B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"],
    "B_NEG": ["B_NEG", "AB_NEG", "O_NEG"],
    "AB_POS": ["AB_POS", "AB_NEG", "A_POS", "B_POS", "O_POS"],
    "AB_NEG": ["AB_NEG", "A_NEG", "B_NEG", "O_NEG"],
    "O_POS": ["O_POS", "O_NEG", "A_POS", "B_POS", "AB_POS"],
    "O_NEG": ["O_NEG"],
}

# Master registry mapping component to compatibility matrix
COMPONENT_COMPATIBILITY_MAP = {
    "RBC": RBC_COMPATIBILITY,
    "Whole_Blood": WHOLE_BLOOD_COMPATIBILITY,
    "Plasma": PLASMA_COMPATIBILITY,
    "Platelets": PLATELETS_COMPATIBILITY,
}


def is_compatible(donor_group: str, recipient_group: str, component: str = "RBC") -> bool:
    """
    Check if a donor blood group is clinically compatible with a recipient
    for a given blood component.

    Parameters:
        donor_group: e.g. 'O_NEG', 'A_POS'
        recipient_group: e.g. 'AB_POS', 'O_POS'
        component: 'RBC', 'Whole_Blood', 'Plasma', 'Platelets'

    Returns:
        bool: True if safe for transfusion, False otherwise.
    """
    matrix = COMPONENT_COMPATIBILITY_MAP.get(component, RBC_COMPATIBILITY)
    compatible_donors = matrix.get(recipient_group, [])
    return donor_group in compatible_donors


def is_compatible_donor_group(
    donor_blood_group: str,
    recipient_blood_group: str,
    component: str = "RBC"
) -> bool:
    """
    Check if a donor blood group is compatible for a recipient and component.
    Explicit API method for Model 3 candidate generation and donor dispatch.

    Note: This logic is for logistical candidate filtering and donor prioritization.
    Final transfusion decisions must always be confirmed through standard clinical
    cross-matching protocols.
    """
    return is_compatible(donor_blood_group, recipient_blood_group, component)



def get_compatible_donors(recipient_group: str, component: str = "RBC") -> List[str]:
    """
    Retrieve all compatible donor blood groups for a given recipient and component.

    Parameters:
        recipient_group: e.g. 'A_NEG'
        component: 'RBC', 'Whole_Blood', 'Plasma', 'Platelets'

    Returns:
        List of compatible donor blood group strings.
    """
    matrix = COMPONENT_COMPATIBILITY_MAP.get(component, RBC_COMPATIBILITY)
    return matrix.get(recipient_group, [recipient_group])


def get_compatible_recipients(donor_group: str, component: str = "RBC") -> List[str]:
    """
    Retrieve all recipient blood groups that can safely receive blood from donor_group.
    """
    matrix = COMPONENT_COMPATIBILITY_MAP.get(component, RBC_COMPATIBILITY)
    recipients = [
        recipient for recipient, donors in matrix.items() if donor_group in donors
    ]
    return recipients
