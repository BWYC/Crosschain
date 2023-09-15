import type { Capability } from "sats-connect";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getCapabilities,
} from "sats-connect";

import CreateFileInscription from "./components/createFileInscription";
import CreateTextInscription from "./components/createTextInscription";
import SendBitcoin from "./components/sendBitcoin";
import SignMessage from "./components/signMessage";
import SignTransaction from "./components/signTransaction";
import { useLocalStorage } from "./useLocalStorage";

import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [paymentAddress, setPaymentAddress] = useLocalStorage("paymentAddress");
  const [paymentPublicKey, setPaymentPublicKey] =
    useLocalStorage("paymentPublicKey");
  const [ordinalsAddress, setOrdinalsAddress] =
    useLocalStorage("ordinalsAddress");
  const [ordinalsPublicKey, setOrdinalsPublicKey] =
    useLocalStorage("ordinalsPublicKey");
  const [network, setNetwork] = useLocalStorage<BitcoinNetworkType>(
    "network",
    BitcoinNetworkType.Testnet
  );
  const [capabilityState, setCapabilityState] = useState<
    "loading" | "loaded" | "missing" | "cancelled"
  >("loading");
  const [capabilities, setCapabilities] = useState<Set<Capability>>();

  useEffect(() => {
    const runCapabilityCheck = async () => {
      let runs = 0;
      const MAX_RUNS = 20;
      setCapabilityState("loading");

      // the wallet's in-page script may not be loaded yet, so we'll try a few times
      while (runs < MAX_RUNS) {
        try {
          await getCapabilities({
            onFinish(response) {
              setCapabilities(new Set(response));
              setCapabilityState("loaded");
            },
            onCancel() {
              setCapabilityState("cancelled");
            },
            payload: {
              network: {
                type: network,
              },
            },
          });
        } catch (e) {
          runs++;
          if (runs === MAX_RUNS) {
            setCapabilityState("missing");
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    runCapabilityCheck();
  }, [network]);

  const isReady =
    !!paymentAddress &&
    !!paymentPublicKey &&
    !!ordinalsAddress &&
    !!ordinalsPublicKey;

  const onWalletDisconnect = () => {
    setPaymentAddress(undefined);
    setPaymentPublicKey(undefined);
    setOrdinalsAddress(undefined);
    setOrdinalsPublicKey(undefined);
  };

  const toggleNetwork = () => {
    setNetwork(
      network === BitcoinNetworkType.Testnet
        ? BitcoinNetworkType.Mainnet
        : BitcoinNetworkType.Testnet
    );
    onWalletDisconnect();
  };

  const onConnectClick = async () => {
    await getAddress({
      payload: {
        purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
        message: "SATS Connect Demo",
        network: {
          type: network,
        },
      },
      onFinish: (response) => {
        const paymentAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Payment
        );
        setPaymentAddress(paymentAddressItem?.address);
        setPaymentPublicKey(paymentAddressItem?.publicKey);

        const ordinalsAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Ordinals
        );
        setOrdinalsAddress(ordinalsAddressItem?.address);
        setOrdinalsPublicKey(ordinalsAddressItem?.publicKey);
      },
      onCancel: () => alert("Request canceled"),
    });
  };

  const capabilityMessage =
    capabilityState === "loading"
      ? "Checking capabilities..."
      : capabilityState === "cancelled"
      ? "Capability check cancelled by wallet. Please refresh the page and try again."
      : capabilityState === "missing"
      ? "Could not find an installed Sats Connect capable wallet. Please install a wallet and try again."
      : !capabilities
      ? "Something went wrong with getting capabilities"
      : undefined;

  if (capabilityMessage) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Sats Connect Test App - {network}</h1>
        <div>{capabilityMessage}</div>
      </div>
    );
  }

  if (!isReady) {
    return (
      
      <div style={{ padding: 30, alignContent: "center", display: "flex", flexDirection: "column",  }}>
      <div style={{height: "70px", maxWidth: "100%", backdropFilter: "blur(10px)", background: "transparent", borderBottom: "solid", borderColor: "white", marginBottom: "5%", borderRadius: "16px"}}>

          <button style={{ height: 30, width: 180, background: "black", borderRadius: "16px", color: "white", borderStyle: "solid", borderColor: "white", fontFamily: "courier" }} onClick={onConnectClick}>
            CONNECT
          </button>


</div>
        <img alt="logo" src="/logo2.png" width={450} height={200}/>
        <h1 style={{color: "white"}}>BWYC CROSSCHAIN {network}</h1>
        <div style={{color: "white"}}>Please connect your wallet to continue</div>

        <div style={{ background: "transparent", padding: 30, marginTop: 10 }}>
          <button style={{ height: 30, width: 180 }} onClick={toggleNetwork}>
            Switch Network
          </button>
          <br />
          <br />

        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Sats Connect Test App - {network}</h1>
      <div>
        <div>Payment Address: {paymentAddress}</div>
        <div>Ordinals Address: {ordinalsAddress}</div>
        <br />

        <div className="container">
          <h3>Disconnect wallet</h3>
          <button onClick={onWalletDisconnect}>Disconnect</button>
        </div>

        <SignTransaction
          paymentAddress={paymentAddress}
          paymentPublicKey={paymentPublicKey}
          ordinalsAddress={ordinalsAddress}
          ordinalsPublicKey={ordinalsPublicKey}
          network={network}
          capabilities={capabilities!}
        />

        <SignMessage
          address={ordinalsAddress}
          network={network}
          capabilities={capabilities!}
        />

        <SendBitcoin
          address={paymentAddress}
          network={network}
          capabilities={capabilities!}
        />

        <CreateTextInscription network={network} capabilities={capabilities!} />

        <CreateFileInscription network={network} capabilities={capabilities!} />
      </div>
    </div>
  );
}

export default App;
