import { Coin, SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { AccountData, OfflineSigner } from "@cosmjs/proto-signing";
import { ChainInfo, Window as KeplrWindow } from "@keplr-wallet/types";
import { ChangeEvent, Component, MouseEvent } from "react";
import styles from "../styles/Home.module.css";

declare global {
  interface Window extends KeplrWindow {}
}

interface FaucetSenderState {
  denom: string;
  faucetBalance: string;
  myAddress: string;
  myBalance: string;
  toSend: string;
}

export interface FaucetSenderProps {
  faucetAddress: string;
  rpcUrl: string;
}

export class FaucetSender extends Component<
  FaucetSenderProps,
  FaucetSenderState
> {
  // Set the initial state
  constructor(props: FaucetSenderProps) {
    super(props);
    this.state = {
      denom: "Loading...",
      faucetBalance: "Loading...",
      myAddress: "Click first",
      myBalance: "Click first",
      toSend: "0",
    };
    setTimeout(this.init, 500);
  }

  // Connecting to the endpoint to fetch the faucet balance
  init = async () =>
    this.updateFaucetBalance(await StargateClient.connect(this.props.rpcUrl));

  // Get the faucet's balance
  updateFaucetBalance = async (client: StargateClient) => {
    const balances: readonly Coin[] = await client.getAllBalances(
      this.props.faucetAddress
    );
    const first: Coin = balances[0];
    this.setState({
      denom: first.denom,
      faucetBalance: first.amount,
    });
  };

  // Store changed token amount to state
  onToSendChanged = (e: ChangeEvent<HTMLInputElement>) =>
    this.setState({
      toSend: e.currentTarget.value,
    });

  // When the user clicks the "send to faucet button"
  onSendClicked = async (e: MouseEvent<HTMLButtonElement>) => {
    // Detect Keplr
    const { keplr } = window;
    if (!keplr) {
      alert("You need to install Keplr");
      return;
    }
    // Get the current state and amount of tokens that we want to transfer
    const { denom, toSend } = this.state;
    const { faucetAddress, rpcUrl } = this.props;
    // Suggest the testnet chain to Keplr
    await keplr.experimentalSuggestChain(this.getTestnetChainInfo());
    // Create the signing client
    const offlineSigner: OfflineSigner =
      window.getOfflineSigner!("theta-testnet-001");
    const signingClient = await SigningStargateClient.connectWithSigner(
      rpcUrl,
      offlineSigner
    );
    // Get the address and balance of your user
    const account: AccountData = (await offlineSigner.getAccounts())[0];
    this.setState({
      myAddress: account.address,
      myBalance: (await signingClient.getBalance(account.address, denom))
        .amount,
    });
    // Submit the transaction to send tokens to the faucet
    const sendResult = await signingClient.sendTokens(
      account.address,
      faucetAddress,
      [
        {
          denom: denom,
          amount: toSend,
        },
      ],
      {
        amount: [{ denom: "uatom", amount: "500" }],
        gas: "200000",
      }
    );
    // Print the result to the console
    console.log(sendResult);
    // Update the balance in the user interface
    this.setState({
      myBalance: (await signingClient.getBalance(account.address, denom))
        .amount,
      faucetBalance: (await signingClient.getBalance(faucetAddress, denom))
        .amount,
    });
  };

  // The Cosmos Hub Testnet chain parameters
  getTestnetChainInfo = (): ChainInfo => ({
    chainId: "theta-testnet-001",
    chainName: "theta-testnet-001",
    rpc: "https://rpc.sentry-01.theta-testnet.polypore.xyz/",
    rest: "https://rest.sentry-01.theta-testnet.polypore.xyz/",
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: "cosmos",
      bech32PrefixAccPub: "cosmos" + "pub",
      bech32PrefixValAddr: "cosmos" + "valoper",
      bech32PrefixValPub: "cosmos" + "valoperpub",
      bech32PrefixConsAddr: "cosmos" + "valcons",
      bech32PrefixConsPub: "cosmos" + "valconspub",
    },
    currencies: [
      {
        coinDenom: "ATOM",
        coinMinimalDenom: "uatom",
        coinDecimals: 6,
        coinGeckoId: "cosmos",
      },
      {
        coinDenom: "THETA",
        coinMinimalDenom: "theta",
        coinDecimals: 0,
      },
      {
        coinDenom: "LAMBDA",
        coinMinimalDenom: "lambda",
        coinDecimals: 0,
      },
      {
        coinDenom: "RHO",
        coinMinimalDenom: "rho",
        coinDecimals: 0,
      },
      {
        coinDenom: "EPSILON",
        coinMinimalDenom: "epsilon",
        coinDecimals: 0,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "ATOM",
        coinMinimalDenom: "uatom",
        coinDecimals: 6,
        coinGeckoId: "cosmos",
      },
    ],
    stakeCurrency: {
      coinDenom: "ATOM",
      coinMinimalDenom: "uatom",
      coinDecimals: 6,
      coinGeckoId: "cosmos",
    },
    coinType: 118,
    gasPriceStep: {
      low: 1,
      average: 1,
      high: 1,
    },
    features: ["stargate", "ibc-transfer", "no-legacy-stdTx"],
  });

  // The render function that draws the component at init and at state change
  render() {
    const { denom, faucetBalance, myAddress, myBalance, toSend } = this.state;
    const { faucetAddress } = this.props;
    // The web page structure itself
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>
          <h1>PayForBlob </h1>
            <div>
              <h3>Namespace</h3>
              <input
                style={{ borderRadius: "5px" , color:"black"}}
                type="text"
                placeholder=" Enter namespace ID"
              ></input>
            </div>
            <div>
              <h3>Hex message</h3>
              <input
                style={{ borderRadius: "5px", color:"black" }}
                type="text"
                placeholder=" Enter HEX message"
              ></input>
            </div>

        </div>
        <button
          style={{
            margin: "10px",
            color: "white",
            backgroundColor: "#4CAF50",
            padding: "10px 10px",
            borderRadius: "5px",
            fontSize: "14zpx",
            cursor: "pointer",
          }}
          onClick={this.onSendClicked}
        >
          Submit{" "}
        </button>
      </div>
    );
  }
}
