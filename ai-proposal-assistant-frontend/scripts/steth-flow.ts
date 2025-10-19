import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseEther,
  toHex,
} from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { formatUnits } from "viem/utils";
import stETHAbi from "./abis/stETH.json";

const RPC = "http://127.0.0.1:8545";
const HOLDER = "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022";
const FUNDER = "0xF39fd6e51aad88F6F4ce6aB8827279cffFb92266";
const SPENDER = "0x000000000000000000000000000000000000dEaD";
const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const ANVIL_PK =
  (process.env.ANVIL_TARGET_PK as `0x${string}` | undefined) ??
  ("0xac0974bec39a17e36ba4a6b4d238ff944bac15993eaf2f005d3d7e9d5a1d8177" as const);
const TARGET_ACCOUNT = privateKeyToAccount(ANVIL_PK);

const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC) });
const walletClient = createWalletClient({
  chain: mainnet,
  transport: http(RPC),
  account: TARGET_ACCOUNT,
});

async function rpc(method: string, params: unknown[]) {
  return publicClient.request({ method, params });
}

async function main() {
  console.log("Target account:", TARGET_ACCOUNT.address);
  // 1. 冒充并转 1 stETH
  await rpc("anvil_impersonateAccount", [HOLDER]);
  try {
    const transferData = encodeFunctionData({
      abi: stETHAbi,
      functionName: "transfer",
      args: [TARGET_ACCOUNT.address, parseEther("1")],
    });
    const txHash = (await publicClient.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: HOLDER,
          to: STETH,
          data: transferData,
        },
      ],
    })) as string;
    console.log("stETH funded tx:", txHash);
    await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  } finally {
    await rpc("anvil_stopImpersonatingAccount", [HOLDER]);
  }

  const balanceAfterFunding = await publicClient.readContract({
    address: STETH,
    abi: stETHAbi,
    functionName: "balanceOf",
    args: [TARGET_ACCOUNT.address],
  });
  console.log(
    "Balance after funding:",
    formatUnits(balanceAfterFunding, 18),
    "stETH",
  );

  const nativeBalance = await publicClient.getBalance({
    address: TARGET_ACCOUNT.address,
  });
  if (nativeBalance < parseEther("0.1")) {
    console.log("Top up target account with 1 ETH from funder");
    await rpc("anvil_impersonateAccount", [FUNDER]);
    try {
      await publicClient.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: FUNDER,
            to: TARGET_ACCOUNT.address,
            value: toHex(parseEther("1")),
          },
        ],
      });
    } finally {
      await rpc("anvil_stopImpersonatingAccount", [FUNDER]);
    }
  }

  // 2. allowance/approve
  const allowanceBefore = await publicClient.readContract({
    address: STETH,
    abi: stETHAbi,
    functionName: "allowance",
    args: [TARGET_ACCOUNT.address, SPENDER],
  });
  await walletClient.writeContract({
    address: STETH,
    abi: stETHAbi,
    functionName: "approve",
    args: [SPENDER, parseEther("5")],
    gas: 500_000n,
  });
  const allowanceAfter = await publicClient.readContract({
    address: STETH,
    abi: stETHAbi,
    functionName: "allowance",
    args: [TARGET_ACCOUNT.address, SPENDER],
  });

  console.log({
    targetBalance: await publicClient.readContract({
      address: STETH,
      abi: stETHAbi,
      functionName: "balanceOf",
      args: [TARGET_ACCOUNT.address],
    }),
    allowanceBefore: {
      wei: allowanceBefore.toString(),
      formatted: formatUnits(allowanceBefore, 18),
    },
    allowanceAfter: {
      wei: allowanceAfter.toString(),
      formatted: formatUnits(allowanceAfter, 18),
    },
  });
}

main().catch(console.error);
