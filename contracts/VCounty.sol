pragma solidity ^0.8.10;

contract VCounty {
    struct Sheriff {
        address wallet;
        string name;
    }

    struct Badge {
        string value;
        uint256 id;
    }

    Sheriff public boss;
    mapping(address => Sheriff) public sheriffs;
    // who owns what badge
    mapping(address => uint256[]) public wallets;
    // contains all minted badges
    mapping(uint256 => Badge) public badges;

    string[] private possibleBadgeNames;
    uint256 private lastId;

    constructor(string[] memory possibleNames) {
        boss = Sheriff(msg.sender, "Marc");
        // we start at 1 so we can recognize unintialized badges
        lastId = 1;
        wallets[boss.wallet].push(lastId);
        badges[lastId] = Badge("The OG", lastId);
        possibleBadgeNames = possibleNames;
    }

    function employ(string memory name, address wallet) external {
        require(
            sheriffs[msg.sender].wallet != address(0) ||
                boss.wallet == msg.sender,
            "Only a sheriff or the boss can employ new sheriffs"
        );
        require(
            sheriffs[wallet].wallet == address(0),
            "Wallet is already sheriff"
        );
        Sheriff memory sheriff = Sheriff(wallet, name);
        sheriffs[sheriff.wallet] = sheriff;
    }

    function mintBadgeFor(address sheriffAddress) external {
        require(boss.wallet == msg.sender, "Only the boss can mint new badges");
        require(
            possibleBadgeNames.length > 0,
            "Out of badges, new sheriffs can only trade for them"
        );
        require(
            sheriffs[sheriffAddress].wallet == sheriffAddress,
            "Address is not a sheriff"
        );
        uint256 nickIndex = random(possibleBadgeNames.length);
        string memory nickname = possibleBadgeNames[nickIndex];
        possibleBadgeNames[nickIndex] = possibleBadgeNames[
            possibleBadgeNames.length - 1
        ];
        possibleBadgeNames.pop();

        lastId++;
        Badge memory newBadge = Badge(nickname, lastId);
        wallets[sheriffAddress].push(lastId);
        badges[lastId] = newBadge;
    }

    function tradeBadge(
        uint256 id,
        address owner,
        address recipient
    ) public {
        require(owner == msg.sender, "You can only transfer your own badges");
        require(
            sheriffs[recipient].wallet != address(0),
            "Recipient is not a sheriff"
        );
        uint256 index = indexOfBadge(id, owner);
        uint256 lastIndex = wallets[owner].length - 1;
        wallets[owner][index] = wallets[owner][lastIndex];
        wallets[owner].pop();
        wallets[recipient].push(id);
    }

    function badge(uint256 id) public view returns (Badge memory) {
        return badges[id];
    }

    function retireBoss(address newBoss) external {
        require(msg.sender == boss.wallet, "only the boss can retire himself");
        require(
            sheriffs[newBoss].wallet != address(0),
            "only a sheriff can be promoted to boss"
        );
        sheriffs[boss.wallet] = boss;
        boss = sheriffs[newBoss];
        delete sheriffs[newBoss];
    }

    function badgeIdsOf(address owner) public view returns (uint256[] memory) {
        return wallets[owner];
    }

    function badgesOf(address owner) public view returns (Badge[] memory) {
        uint256[] memory badgeIds = wallets[owner];
        Badge[] memory fetchedBadges = new Badge[](badgeIds.length);
        for (uint256 i = 0; i < badgeIds.length; i++) {
            fetchedBadges[i] = badges[badgeIds[i]];
        }
        return fetchedBadges;
    }

    function indexOfBadge(uint256 id, address owner)
        private
        view
        returns (uint256)
    {
        for (uint256 i = 0; i < wallets[owner].length; i++) {
            if (wallets[owner][i] == id) {
                return i;
            }
        }
        revert(
            "Specified owner does not own specified badge, or it doesnt exist."
        );
    }

    function random(uint256 number) private view returns (uint256) {
        bytes memory packed = abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender
        );
        return uint256(keccak256(packed)) % number;
    }
}
