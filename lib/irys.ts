
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";

/**
 * Step 1: Connect to Irys using the wallet adapter
 * Returns an Irys uploader instance that can upload data to Arweave
 */
export const getIrysUploader = async (wallet: any) => {
    try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_ENDPOINT;
        //@ts-ignore
        const irysUploader = await WebUploader(WebSolana).withProvider(wallet).withRpc(rpcUrl).devnet();
        console.log(`Connected to Irys from ${irysUploader.address}`);
        return irysUploader;
    } catch (error) {
        console.error("Error connecting to Irys:", error);
        throw new Error("Error connecting to Irys");
    }
};

/**
 * Step 2: Fund the Irys node so we can upload data
 * On devnet this uses devnet SOL
 */
export const fundNode = async (irysUploader: any) => {
    if (!irysUploader) {
        throw new Error("Irys uploader not initialized");
    }
    try {
        const fundTx = await irysUploader.fund(
            irysUploader.utils.toAtomic(0.0001)
        );
        console.log("Fund tx:", fundTx);
        return fundTx;
    } catch (error) {
        console.error("Error while funding:", error);
        throw new Error("Error while funding Irys node");
    }
};

/**
 * Step 3: Upload the metadata JSON to Arweave via Irys
 * 
 * Takes the form data (tokenName, tokenSymbol, imageUrl) and:
 * 1. Builds a Metaplex-compatible JSON metadata object
 * 2. Uploads it to Arweave
 * 3. Returns the permanent URL (https://gateway.irys.xyz/<id>)
 * 
 * NOTE: Right now we use the user-provided imageUrl directly.
 * Ideally we'd upload the image to Arweave first, then reference
 * that Arweave image URL in the JSON. That's a future improvement
 * (requires file upload input instead of URL input).
 */
export const uploadMetadataJson = async (
    irysUploader: any,
    data: { tokenName: string; tokenSymbol: string; imageUrl: string }
): Promise<string> => {
    // Build the Metaplex-standard metadata JSON
    // This is what wallets/explorers expect when they fetch the token's URI
    const metadataJson = {
        name: data.tokenName,
        symbol: data.tokenSymbol,
        description: `${data.tokenName} (${data.tokenSymbol}) - Created on Solana Token Launchpad`,
        image: data.imageUrl,
        attributes: [],
        properties: {
            files: [
                {
                    uri: data.imageUrl,
                    type: "image/png",
                }
            ],
        },
    };

    const jsonString = JSON.stringify(metadataJson);
    console.log("Uploading metadata JSON:", jsonString);

    const tags = [
        { name: "Content-Type", value: "application/json" },
        { name: "application-id", value: "solana-token-launchpad" },
    ];

    const receipt = await irysUploader.upload(jsonString, { tags });
    const metadataUrl = `https://gateway.irys.xyz/${receipt.id}`;

    console.log("Metadata uploaded to Arweave!");
    console.log("Receipt ID:", receipt.id);
    console.log("Metadata URL:", metadataUrl);

    return metadataUrl;
};
