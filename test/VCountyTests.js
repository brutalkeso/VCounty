const VCounty = artifacts.require('VCounty')
const assert = require("chai").assert
const truffleAssert = require('truffle-assertions')

contract('VCounty', (accounts) => {
    let vCounty;
    let badges = ["a", "b", "c"];

    beforeEach(async () => {
        vCounty = await VCounty.new(badges, { from: accounts[0] })
    })

    it("should succeed at employing new sheriff", async () => {
        await truffleAssert.passes(vCounty.employ("", accounts[1], { from: accounts[0] }))
    })

    it("should return succeed at fetching badges even if address is not a sheriff", async () => {
        truffleAssert.passes(vCounty.badgeIdsOf(accounts[1]));
    })

    it("should pass when caller is deployer", async () => {
        truffleAssert.passes(vCounty.badgeIdsOf(accounts[0]));
    })

    it("new sheriff should start without badges", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        const ids = await vCounty.badgeIdsOf(accounts[1]);
        assert(ids.length == 0);
    })

    it("sheriff should not be able to mint", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        truffleAssert.fails(vCounty.mintBadgeFor(accounts[1], { from: accounts[1] }), "Only the boss can mint new badges");
    })

    it("boss should be able to mint", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { from: accounts[0] });
        const ids = await vCounty.badgeIdsOf(accounts[1]);
        assert(ids.length == 1);
    })

    it("boss shouldnt be able to mint for non sheriff", async () => {
        await truffleAssert.fails(vCounty.mintBadgeFor(accounts[1], { from: accounts[0] }), "Address is not a sheriff");
    })

    it("should mint one of the badges", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        const ids = await vCounty.badgeIdsOf(accounts[1]);
        const badge = await vCounty.badge(ids[0]);
        assert(badges.includes(badge.value));
    })

    it("should throw error after running out of badge names", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        for (i = 0; i < 3; i++) {
            await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        }
        await truffleAssert.fails(vCounty.mintBadgeFor(accounts[1], { from: accounts[0] }), "Out of badges, new sheriffs can only trade for them");
    })

    it("should throw error attempting to make sheriff address sheriff again", async () => {
        await vCounty.employ("1", accounts[1], { from: accounts[0] });
        await truffleAssert.fails(
            vCounty.employ("2", accounts[1], { from: accounts[0] }),
            "wallet is already sheriff"
        );
    })

    it("should return empty badges array for non sheriff", async () => {
        const fetchedBadges = await vCounty.badgesOf(accounts[1])
        assert(fetchedBadges.length == 0);
    })

    it("should return empty badges array for new sheriff", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        const fetchedBadges = await vCounty.badgesOf(accounts[1]);
        assert(fetchedBadges.length == 0);
    })

    it("should return badges array of length one for sheriff with one minted badge", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { from: accounts[0] });
        const fetchedBadges = await vCounty.badgesOf(accounts[1]);
        assert(fetchedBadges.length == 1);
    })
    it("should return badges array with correct element after minting", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { from: accounts[0] });
        const fetchedBadges = await vCounty.badgesOf(accounts[1]);
        assert(badges.includes(fetchedBadges[0].value));
    })

    it("should return all correct values from badgesOf, after multiple mintings", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        for (i = 0; i < 3; i++) {
            await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        }
        const fetchedBadges = await vCounty.badgesOf(accounts[1]);
        for (i = 0; i < 3; i++) {
            assert(badges.includes(fetchedBadges[i].value));
        }
    })

    it("should not allow badge trade of non minted nft id", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.employ("", accounts[2], { from: accounts[0] });
        await truffleAssert.fails(
            vCounty.tradeBadge(
                2,
                accounts[1],
                accounts[2],
                { gasPrice: 0, from: accounts[1] }
            ),
            "Specified owner does not own specified badge, or it doesnt exist."
        );
    })


    it("should not allow badge trade of nft someone else owns", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.employ("", accounts[2], { from: accounts[0] });
        await vCounty.employ("", accounts[3], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[3], { gasPrice: 0, from: accounts[0] });
        await truffleAssert.fails(
            vCounty.tradeBadge(
                2,
                accounts[1],
                accounts[2],
                { gasPrice: 0, from: accounts[1] }
            ),
            "Specified owner does not own specified badge, or it doesnt exist."
        );
    })


    it("should not allow badge trade to non sheriff", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        await truffleAssert.fails(
            vCounty.tradeBadge(
                2,
                accounts[1],
                accounts[2],
                { gasPrice: 0, from: accounts[1] }
            ),
            "Recipient is not a sheriff"
        );
    })

    it("should allow badge trade to sheriff", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.employ("", accounts[2], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        await truffleAssert.passes(
            vCounty.tradeBadge(
                2,
                accounts[1],
                accounts[2],
                { gasPrice: 0, from: accounts[1] }
            )
        );
    })

    it("should not allow badge trade from recipient", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        await truffleAssert.fails(
            vCounty.tradeBadge(
                2,
                accounts[1],
                accounts[2],
                { gasPrice: 0, from: accounts[2] }
            ),
            "You can only transfer your own badges"
        );
    })

    it("should not allow badge trade from third party", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        await truffleAssert.fails(
            vCounty.tradeBadge(
                2,
                accounts[1],
                accounts[2],
                { gasPrice: 0, from: accounts[3] }
            ),
            "You can only transfer your own badges"
        );
    })

    it("old owner should loose badge", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.employ("", accounts[2], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        await vCounty.tradeBadge(
            2,
            accounts[1],
            accounts[2],
            { gasPrice: 0, from: accounts[1] }
        );
        const ids = await vCounty.badgeIdsOf(accounts[1]);
        assert(ids.length == 0);
    })


    it("new owner should gain badge", async () => {
        await vCounty.employ("", accounts[1], { from: accounts[0] });
        await vCounty.employ("", accounts[2], { from: accounts[0] });
        await vCounty.mintBadgeFor(accounts[1], { gasPrice: 0, from: accounts[0] });
        await vCounty.tradeBadge(
            2,
            accounts[1],
            accounts[2],
            { gasPrice: 0, from: accounts[1] }
        );
        const ids = await vCounty.badgeIdsOf(accounts[2]);
        assert(ids.length == 1);
    })

})