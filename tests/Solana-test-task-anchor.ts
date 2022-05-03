import * as anchor from "@project-serum/anchor";
import { Program, web3 } from "@project-serum/anchor";
import { SolanaTestTaskAnchor } from "../target/types/solana_test_task_anchor";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import * as fs from "fs";
import { delay } from "./utils";

chai.use(chaiAsPromised);

describe("Solana-test-task-anchor", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .SolanaTestTaskAnchor as Program<SolanaTestTaskAnchor>;
  const programProvider = program.provider as anchor.AnchorProvider;

  const adminSecretKey = JSON.parse(
    fs.readFileSync("localnet/admin.json", "utf-8")
  );
  const admin = anchor.web3.Keypair.fromSecretKey(Buffer.from(adminSecretKey));
  let user = anchor.web3.Keypair.generate();
  const [deposit, _] = findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("deposit")],
    program.programId
  );
  const [depositHistory, __] = findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("deposit-hisotry"),
      user.publicKey.toBytes(),
    ],
    program.programId
  );

  it("Initialize works", async () => {
    await programProvider.connection.requestAirdrop(
      admin.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    await delay(1000);

    const tx = await program.methods
      .initialize()
      .accounts({ admin: admin.publicKey, deposit })
      .signers([admin])
      .rpc();

    console.log("Initialization transaction signature", tx);

    expect(program.account.deposit.fetch(deposit)).to.eventually.deep.equal({});
  });

  it("Double initialize doesn't work", async () => {
    await programProvider.connection.requestAirdrop(
      admin.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    await delay(1000);

    expect(
      program.methods
        .initialize()
        .accounts({ admin: admin.publicKey, deposit })
        .signers([admin])
        .rpc()
    ).to.be.rejectedWith();
  });

  it("Deposit works", async () => {
    await programProvider.connection.requestAirdrop(
      user.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    await delay(1000);

    const tx = await program.methods
      .deposit(new anchor.BN(web3.LAMPORTS_PER_SOL))
      .accounts({ user: user.publicKey, deposit, depositHistory })
      .signers([user])
      .rpc();

    console.log("Deposit transaction signature", tx);

    const userBalance =
      (await programProvider.connection.getAccountInfo(user.publicKey))
        .lamports / web3.LAMPORTS_PER_SOL;
    const depositBalance =
      (await programProvider.connection.getAccountInfo(deposit)).lamports /
      web3.LAMPORTS_PER_SOL;

    expect(userBalance).to.be.equal(8.99899776);
    expect(depositBalance).to.be.equal(1.00094656);

    const userDepositHistory = await program.account.depositHistory.fetch(
      depositHistory
    );
    expect(userDepositHistory.amount.toNumber()).to.deep.equal(1000000000);
  });

  it("Withdraw works", async () => {
    const tx = await program.methods
      .withdraw()
      .accounts({ admin: admin.publicKey, deposit })
      .signers([admin])
      .rpc();

    console.log("Withdraw transaction signature", tx);

    const adminBalance =
      (await programProvider.connection.getAccountInfo(admin.publicKey))
        .lamports / web3.LAMPORTS_PER_SOL;
    const depositBalance =
      (await programProvider.connection.getAccountInfo(deposit)).lamports /
      web3.LAMPORTS_PER_SOL;

    expect(adminBalance).to.be.equal(10.99905344);
    expect(depositBalance).to.be.equal(0.00094656);
  });
});
