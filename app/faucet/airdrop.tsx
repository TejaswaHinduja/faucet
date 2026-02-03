import { Button } from "@/components/ui/button";
import { useWallet,useConnection } from "@solana/wallet-adapter-react";

export function Airdrop(){

const wallet=useWallet();
const {connection}=useConnection()
async function sendAirdrop(){
    if (!wallet.publicKey) return;
    console.log(wallet.publicKey)
    await connection.requestAirdrop(wallet.publicKey,10000000000)
    alert("airdrop sent")

}
return <div>
    {wallet.publicKey?.toString()}
    <Button onClick={sendAirdrop} disabled={!wallet.publicKey}>Send AirDrop</Button>
</div>

}
