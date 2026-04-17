'use client'

import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { PARLAYZ_MARKET_ABI } from '@/src/abi/ParlayzMarket'
import { parseUnits } from 'viem'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS as `0x${string}`
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`
const USDT_DECIMALS = 6

const USDT_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useMarketCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PARLAYZ_MARKET_ABI,
    functionName: 'marketCount',
  })
}

export function useMarket(marketId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PARLAYZ_MARKET_ABI,
    functionName: 'getMarket',
    args: [marketId],
  })
}

export function usePlaceBet() {
  const { writeContractAsync } = useWriteContract()

  const placeBet = async (marketId: bigint, outcomeIndex: number, amount: number) => {
    const amountWei = parseUnits(amount.toString(), USDT_DECIMALS)

    // First approve USDT spend
    const approveTx = await writeContractAsync({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, amountWei],
    })

    // Then place bet
    const betTx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: PARLAYZ_MARKET_ABI,
      functionName: 'placeBet',
      args: [marketId, outcomeIndex, amountWei],
    })

    return { approveTx, betTx }
  }

  return { placeBet }
}

export function useSettleManualMarket() {
  const { writeContractAsync } = useWriteContract()

  const settle = async (marketId: bigint, outcomeIndex: number, timestamp: bigint, signature: `0x${string}`) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: PARLAYZ_MARKET_ABI,
      functionName: 'settleManualMarket',
      args: [marketId, outcomeIndex, timestamp, signature],
    })
  }

  return { settle }
}

export function useClaimWinnings() {
  const { writeContractAsync } = useWriteContract()

  const claim = async (marketId: bigint, betIndex: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: PARLAYZ_MARKET_ABI,
      functionName: 'claimWinnings',
      args: [marketId, betIndex],
    })
  }

  return { claim }
}
