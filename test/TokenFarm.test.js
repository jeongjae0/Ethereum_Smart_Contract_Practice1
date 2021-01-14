const { assert } = require('chai')
const { default: Web3 } = require('web3')
const _deploy_contracts = require('../migrations/2_deploy_contracts')

const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai').use(require('chai-as-promised')).should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {

    let daiToken, dappToken, tokenFarm

    before(async () => {
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        await dappToken.transfer(tokenFarm.address, tokens('1000000'))
    })


    describe('Mock DAI Token Deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })


    describe('Dapp Token Deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })

    describe('Token Farm Deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })


    describe('Farming token', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result
            
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            await tokenFarm.stakeTokens(tokens('100'), { from : investor })

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'Wrong Balance')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'Wrong Balance')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance is correct')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking balance is correct')

            await tokenFarm.issueToken({ from : owner })

            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'Dapp Token Balance is correct')    

            await tokenFarm.issueTokens({ from : investor }).should.be.rejected;

            await tokenFarm.unstakeTokens({ from : investor })

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'Investor received mDai token back')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm mDai balance is correct')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'Investor staking balance is correct')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'Investor staking status correct')
        })
    })
    
}) 