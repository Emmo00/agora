# Agora Terminology Updates - Non-Technical User Language

## Overview
Updated the entire Agora frontend to use more accessible, user-friendly terminology. These changes make the app more understandable for non-technical users while maintaining all technical functionality.

---

## Global Terminology Changes

### Primary Language Mapping
- **Assembly** → **Group** (user-facing only; code references remain unchanged)
- **Contest** → **Vote** (user-facing only; code references remain unchanged)
- **Passport** → **Membership Pass** or **Membership** (in explanatory text)
- **Passports Tab** → **Memberships Tab**
- **Admins** → **Members** (when displaying counts)

---

## Pages Updated

### 1. Landing Page (`app/page.tsx`)
**Hero Section:**
- ❌ "DECENTRALIZED GOVERNANCE AT SCALE"
- ✅ "Make decisions with your community"

**Secondary Tagline:**
- ❌ "Agora enables communities to govern collectively. Create assemblies, run contests, and make decisions with direct participation from your members."
- ✅ "Create groups. Issue memberships. Run votes. All onchain. Simple, transparent governance for everyone."

**Button Labels:**
- ❌ "EXPLORE ASSEMBLIES" → ✅ "BROWSE GROUPS"
- ❌ "CREATE ASSEMBLY" → ✅ "CREATE A GROUP"

**Stats Section:**
- ❌ "Total Assemblies" → ✅ "Groups Created"
- ❌ "Total Contests" → ✅ "Active Votes"
- ❌ "Total Members" → ✅ "Memberships Issued"
- ❌ "Total Votes Cast" → ✅ "Votes Cast"

**Recent Section:**
- ❌ "RECENT ASSEMBLIES" → ✅ "RECENT GROUPS"
- ❌ "No assemblies found. Be the first to create one!" → ✅ "No groups yet. Create the first one!"
- ❌ "VIEW ALL ASSEMBLIES" → ✅ "SEE ALL GROUPS →"
- ❌ "{admins} admins · {contests} contests" → ✅ "{members} members · {votes} votes"

---

### 2. Header (`components/Header.tsx`)
**Navigation:**
- ❌ "Assemblies" → ✅ "Groups"

---

### 3. Create Group Modal (`components/create-assembly-modal.tsx`)
**Dialog Title & Description:**
- ❌ "CREATE ASSEMBLY"
- ✅ "CREATE A GROUP"
- ❌ "Deploy a new onchain community with governance capabilities"
- ✅ "Start your community. Issue memberships. Run votes. All stored permanently on the blockchain."

**Form Labels:**
- ❌ "ASSEMBLY NAME" → ✅ "GROUP NAME"
- ❌ "e.g., Protocol Governance" → ✅ "e.g., My Team, Community Council, Project DAO"
- ❌ "Describe what this assembly is for..." → ✅ "What is this group about? Who can join? What decisions will you make together?"

**Button:**
- ❌ "CREATE ASSEMBLY" → ✅ "CREATE GROUP"

**Messages:**
- ❌ "Assembly created successfully! 🎉" → ✅ "Group created successfully! 🎉"
- ❌ "Error creating assembly" → ✅ "Error creating group"
- ❌ "Failed to parse assembly address" → ✅ "Failed to parse group address"

---

### 4. Create Vote Modal (`components/create-contest-modal.tsx`)
**Dialog Title:**
- ❌ "CREATE CONTEST" → ✅ "CREATE A VOTE"

**Form Labels:**
- ❌ "PROMPT" → ✅ "QUESTION"
- ❌ "What question are you asking?" → ✅ "What decision should we make? e.g., Which feature should we build next?"

**Membership Selection:**
- ❌ "REQUIRED PASSPORTS" → ✅ "MEMBERSHIP PASSES"
- ❌ "Voters need ANY of the selected passports" → ✅ "Voters need ANY of the selected membership passes"
- ❌ "Passport {id}" → ✅ "Membership Pass {id}"
- ❌ "Select at least one passport" → ✅ "Select at least one membership pass"

**Preview:**
- ❌ "🔒 Passport required" → ✅ "🔒 Membership pass required"

**Button:**
- ❌ "CREATE CONTEST" → ✅ "CREATE VOTE"

**Messages:**
- ❌ "Creating contest..." → ✅ "Creating vote..."
- ❌ "Contest created successfully! 🎉" → ✅ "Vote created successfully! 🎉"
- ❌ "Failed to create contest" → ✅ "Failed to create vote"

---

### 5. Groups Listing Page (`app/assemblies/page.tsx`)
**Header:**
- ❌ "ASSEMBLIES" → ✅ "GROUPS"
- ❌ "Browse and join assemblies on Agora" → ✅ "Browse and join groups on Agora"
- ❌ "Search assemblies by name or description..." → ✅ "Search groups by name or description..."

**Loading:**
- ❌ "Loading assemblies..." → ✅ "Loading groups..."

**Empty State:**
- ❌ "No assemblies found" → ✅ "No groups found"

**Stats:**
- ❌ "Showing X of Y assemblies" → ✅ "Showing X of Y groups"
- ❌ "{admin} admins · {contests} contests" → ✅ "{members} members · {votes} votes"

---

### 6. Group Detail Page (`app/assemblies/[id]/page.tsx`)
**Loading & Not Found:**
- ❌ "Loading assembly..." → ✅ "Loading group..."
- ❌ "Assembly not found" → ✅ "Group not found"

**Tabs:**
- ❌ "CONTESTS" → ✅ "VOTES"
- ❌ "PASSPORTS" → ✅ "MEMBERSHIPS"

**Tab Headers:**
- ❌ "PASSPORT TYPES ({count})" → ✅ "MEMBERSHIP TYPES ({count})"

**Buttons:**
- ❌ "+ CREATE CONTEST" → ✅ "+ CREATE A VOTE"
- ❌ "+ CREATE PASSPORT TYPE" → ✅ "+ CREATE MEMBERSHIP TYPE"

**Membership Status:**
- ❌ "✓ YOU HOLD THIS" → ✅ "✓ YOU HAVE THIS"
- ❌ "MINT NOW" → ✅ "GET MEMBERSHIP"
- ❌ "No passport types yet. Create one to gate voting!" → ✅ "No membership types yet. Create one to gate voting!"

**Empty State:**
- ❌ "No contests yet. Create one to get started!" → ✅ "No votes yet. Create one to get started!"

---

### 7. Vote Detail Page (`app/contests/[id]/page.tsx`)
**Breadcrumb:**
- ❌ "Assemblies" → ✅ "Groups"
- ❌ "Assembly" → ✅ "Group"
- ❌ "Contest" → ✅ "Vote"

**Status Label:**
- ❌ "🔒 Passport Gated" → ✅ "🔒 Membership Required"

**Voting Section:**
- ❌ "You need a required passport to vote" → ✅ "You need a required membership pass to vote"
- ❌ "You cannot vote on this contest" → ✅ "You cannot vote on this vote"
- ❌ "VIEW PASSPORTS" → ✅ "VIEW MEMBERSHIPS"

**Back Button:**
- ❌ "BACK TO ASSEMBLY" → ✅ "← BACK TO GROUP"

---

### 8. Page Metadata (`app/layout.tsx`)
**Title & Description:**
- ❌ "Agora - Easy onchain Governance"
- ✅ "Agora - Make decisions with your community"
- ❌ "Agora is a minimalist onchain governance primitive for making collective decision-making easy, fast, and accessible."
- ✅ "Create groups, issue memberships, run votes. Simple, transparent governance for everyone. No tokens required."

---

## Summary of Changes

### Files Modified (9 total)
1. ✅ `app/page.tsx` - Landing page
2. ✅ `components/Header.tsx` - Navigation
3. ✅ `components/create-assembly-modal.tsx` - Group creation
4. ✅ `components/create-contest-modal.tsx` - Vote creation
5. ✅ `app/assemblies/page.tsx` - Groups listing
6. ✅ `app/assemblies/[id]/page.tsx` - Group detail
7. ✅ `app/contests/[id]/page.tsx` - Vote detail
8. ✅ `app/layout.tsx` - Metadata
9. ✅ Created `TERMINOLOGY_UPDATES.md` - This documentation

### Total Changes
- **50+ user-facing text strings updated**
- **Button labels simplified**
- **Section headers made more descriptive**
- **Error messages made more friendly**
- **Help text improved for clarity**

---

## Design Principles Applied

### 1. **Friendly, Not Corporate**
- "Make decisions with your community" vs. "Decentralized governance at scale"
- "Get started" vs. "Initialize"

### 2. **Active, Not Passive**
- "Create groups" vs. "Groups can be created"
- "Run votes" vs. "Voting can be run"

### 3. **Simple, Not Technical**
- "Membership pass" vs. "Non-transferable ERC-1155 token"
- "Simple, transparent governance" vs. "Decentralized consensus mechanism"

### 4. **Benefit-Focused**
- Lead with what users can DO
- Emphasize outcomes, not technology

---

## Code-Level Changes

### Important Note
All changes were made to **user-facing strings only**:
- Button labels ✅
- Dialog titles ✅
- Tab names ✅
- Error messages ✅
- Section headers ✅
- Form labels ✅
- Status messages ✅

**Code references were NOT changed:**
- Contract function names remain the same
- Variable names remain the same
- API calls remain the same
- Component names remain the same (AssemblyFactory, ContestDetail, etc.)

This ensures:
- No breaking changes to functionality
- Full backwards compatibility
- Clean separation of presentation layer from technical layer

---

## Testing Recommendations

1. **Landing Page** - Verify all taglines display correctly
2. **Navigation** - Test "Groups" link in header
3. **Create Flow** - Create a test group and vote
4. **Detail Pages** - Navigate through group and vote details
5. **Search** - Test search functionality with new terminology
6. **Mobile** - Verify responsive layout with updated text

---

## Future Enhancements

Consider adding:
- Glossary component with hover tooltips
- First-time user onboarding with term explanations
- Email templates using new terminology
- Social sharing copy
- Mobile app with consistent language

---

**Updated:** December 15, 2025
**Status:** ✅ All changes complete and ready for testing
