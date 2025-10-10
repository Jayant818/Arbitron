import { APIError } from "@/lib/errors";
import axios from "axios";

export enum TokenCategory {
  TOP_ORGANIC_SCORE = "toporganicscore",
  TOP_TRADED = "toptraded",
  TOP_TRENDING = "toptrending",
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  circSupply: number;
  totalSupply: number;
  tokenProgram: string;
  usdPrice: number;
  priceBlockId: number;
  liquidity: number;
  stats24h: {
    priceChange: number;
    liquidityChange: number;
    volumeChange: number;
    buyVolume: number;
    sellVolume: number;
    buyOrganicVolume: number;
    sellOrganicVolume: number;
    numBuys: number;
    numSells: number;
    numTraders: number;
    numOrganicBuyers: number;
    numNetBuyers: number;
  };
}

export const fetchAllTokens = async () => {
  try {
    const res = await axios.get<Token[]>(
      "https://lite-api.jup.ag/tokens/v2/tag?query=verified"
    );

    return res.data;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    throw new APIError("Failed to fetch tokens", 500, error);
  }
};

export const fetchTokenPrice = async (mintAddresses: string[]) => {
  try {
    const res = await axios.get<Token[]>(
      `https://lite-api.jup.ag/price/v3?ids=${mintAddresses.join(",")}`
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    throw new APIError("Failed to fetch token prices", 500, error);
  }
};

export const fetchTokenPriceByCategory = async (category: TokenCategory) => {
  try {
    const res = await axios.get<Token[]>(
      `https://lite-api.jup.ag/tokens/v2/${category}/1h?limit=10`
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching token prices by category:", error);
    throw new APIError("Failed to fetch token prices by category", 500, error);
  }
};
