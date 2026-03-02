"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";

const getIrysUploader = async (wallet: any) => {
  try {
    const rpcUrl=process.env.NEXT_PUBLIC_RPC_ENDPOINT
    //@ts-ignore
    const irysUploader = await WebUploader(WebSolana).withProvider(wallet).withRpc(rpcUrl).devnet();
    return irysUploader;
  } catch (error) {
    console.error("Error connecting to Irys:", error);
    throw new Error("Error connecting to Irys");
  }
};

const ConnectIrys = () => {
  const wallet = useWallet();
  const [isConnected, setIsConnected] = useState(false);
  const [irysUploader, setIrysUploader] = useState<any>(null);

  const connectToIrys = async () => {
    if (!wallet?.connected) {
      console.log("Wallet not connected");
      return;
    }

    try {
      const uploader = await getIrysUploader(wallet);
      console.log(`Connected to Irys from ${uploader.address}`);
      setIrysUploader(uploader);
      setIsConnected(true);
    } catch (error) {
      console.log("Error connecting to Irys");
    }
  };

  const fundNode = async () => {
    if (!irysUploader) {
      alert("Connect to Irys first");
      return;
    }
    try {
      const fundTx = await irysUploader.fund(
        irysUploader.utils.toAtomic(0.0001)
      );
      console.log(fundTx);
    } catch (error) {
      console.log("Error while funding", error);
      alert("Error while funding");
    }
  };

  const uploadData = async ()=> {
    if(!irysUploader){
      return
    }
    const data="Does it work";
    const tags=[{name:"application-id",value:"EG"}]

    try{
      const receipt=await irysUploader.upload(data,{tags});
      alert(`data uploaded https://gateway.irys.xyz/${receipt.id}`)
    }catch(e){
      alert(e)
    }
  }

  return (
    <div>
      <button onClick={connectToIrys}>
        {isConnected ? "Connected to Irys" : "Connect Irys"}
      </button>

      <button onClick={fundNode} disabled={!isConnected}>
        Fund Account
      </button>

      <button onClick={uploadData}>Upload data</button>
    </div>
  );
};

export default ConnectIrys;

