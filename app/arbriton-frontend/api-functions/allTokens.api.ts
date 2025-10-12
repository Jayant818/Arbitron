import { APIError } from "@/lib/errors";
import axios from "axios";

export enum TokenCategory {
  NEW_LISTED = "new-listed",
  TOP_ORGANIC = "top-organic",
  TOP_TRADED = "top-traded",
  TRENDING = "trending",
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

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function axiosWithRetry(
  options: any,
  retries = 3,
  delayTime = 1000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.request(options);
      return res;
    } catch (error: any) {
      if (error?.response?.status !== 429 || attempt === retries) {
        throw error;
      }

      const retryAfter = error.response.headers["retry-after"];
      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : delayTime * attempt;

      console.warn(
        `Rate limit hit (attempt ${attempt}), retrying in ${waitTime}ms...`
      );

      await delay(waitTime);
    }
  }
}

function mapBirdeyeToToken(item: any): Token {
  return {
    id: item.address,
    name: item.name,
    symbol: item.symbol,
    icon: item.logo_uri || item.logoURI || "",
    decimals: item.decimals,
    circSupply:
      item.circulating_supply || item.marketcap || item.market_cap || 0,
    totalSupply: item.total_supply || 0,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: item.price || 0,
    priceBlockId: 0,
    liquidity: item.liquidity || 0,
    stats24h: {
      priceChange:
        item.price_change_24h_percent || item.price24hChangePercent || 0,
      liquidityChange: 0,
      volumeChange:
        item.volume_24h_change_percent || item.volume24hChangePercent || 0,
      buyVolume: item.volume_buy_24h_usd || 0,
      sellVolume: item.volume_sell_24h_usd || 0,
      buyOrganicVolume: 0,
      sellOrganicVolume: 0,
      numBuys: item.buy_24h || 0,
      numSells: item.sell_24h || 0,
      numTraders: item.unique_wallet_24h || 0,
      numOrganicBuyers: 0,
      numNetBuyers: 0,
    },
  };
}

function mapJupiterToToken(item: any): Token {
  return {
    id: item.id,
    name: item.name,
    symbol: item.symbol,
    icon: item.icon,
    decimals: item.decimals,
    circSupply: item.circSupply,
    totalSupply: item.totalSupply,
    tokenProgram: item.tokenProgram,
    usdPrice: item.usdPrice,
    priceBlockId: item.priceBlockId || 0,
    liquidity: item.liquidity,
    stats24h: {
      priceChange: item.stats24h?.priceChange || 0,
      liquidityChange: item.stats24h?.liquidityChange || 0,
      volumeChange: item.stats24h?.volumeChange || 0,
      buyVolume: item.stats24h?.buyVolume || 0,
      sellVolume: item.stats24h?.sellVolume || 0,
      buyOrganicVolume: item.stats24h?.buyOrganicVolume || 0,
      sellOrganicVolume: item.stats24h?.sellOrganicVolume || 0,
      numBuys: item.stats24h?.numBuys || 0,
      numSells: item.stats24h?.numSells || 0,
      numTraders: item.stats24h?.numTraders || 0,
      numOrganicBuyers: item.stats24h?.numOrganicBuyers || 0,
      numNetBuyers: item.stats24h?.numNetBuyers || 0,
    },
  };
}

export const fetchAllTokens = async () => {
  try {
    return await fetchJupiterSearch("");
  } catch (error) {
    console.error("Error fetching tokens:", error);
    throw new APIError("Failed to fetch tokens", 500, error);
  }
};

export const fetchJupiterSearch = async (query: string) => {
  try {
    const res = await axios.get(
      `https://lite-api.jup.ag/tokens/v2/search?query=${query}`
    );
    return res.data.map(mapJupiterToToken);
  } catch (error) {
    console.error("Error fetching Jupiter search:", error);
    throw new APIError("Failed to fetch Jupiter search", 500, error);
  }
};

export const fetchTokenPriceByCategory = async (category: TokenCategory) => {
  try {
    let url: string;
    let params: any = {};
    let mapper = mapBirdeyeToToken;
    let headers: any = { accept: "application/json", "x-chain": "solana" };

    switch (category) {
      // case TokenCategory.NEW_LISTED:
      //   url = "https://public-api.birdeye.so/defi/v2/tokens/new_listing";
      //   params = { limit: "20", meme_platform_enabled: "false" };
      //   headers["x-api-key"] = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
      //   break;
      case TokenCategory.TRENDING:
        url = "https://public-api.birdeye.so/defi/token_trending";
        params = {
          sort_by: "volume24hUSD",
          sort_type: "desc",
          offset: "0",
          limit: "20",
          ui_amount_mode: "scaled",
        };
        headers["x-api-key"] = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
        break;
      case TokenCategory.TOP_ORGANIC:
        url = "https://lite-api.jup.ag/tokens/v2/toporganicscore/24h";
        params = { limit: "50" };
        mapper = mapJupiterToToken;
        headers = { accept: "application/json" };
        break;
      case TokenCategory.TOP_TRADED:
        url = "https://lite-api.jup.ag/tokens/v2/toptraded/24h";
        params = { limit: "50" };
        mapper = mapJupiterToToken;
        headers = { accept: "application/json" };
        break;
      default:
        throw new Error("Invalid category");
    }

    const options = {
      method: "GET",
      url,
      params,
      headers,
    };

    const res = await axiosWithRetry(options);

    // if (category === TokenCategory.NEW_LISTED) {
    //   let items = res?.data.data.items || [];
    //   const pricePromises = items.map(async (item: any) => {
    //     const tradeOptions = {
    //       method: "GET",
    //       url: `https://lite-api.jup.ag/price/v3?ids=${item.address}`,
    //     };
    //     try {
    //       const tradeRes = await axios.request(tradeOptions);
    //       console.log("Trade res:", tradeRes.data);
    //       return { ...item, price: tradeRes.data.data.price || 0 };
    //     } catch (err) {
    //       console.error(`Error fetching price for ${item.address}:`, err);
    //       return { ...item, price: 0 };
    //     }
    //   });
    //   items = await Promise.all(pricePromises);
    //   return items.map(mapBirdeyeToToken);
    // }

    const items =
      res?.data.data?.items ||
      res?.data.data?.tokens ||
      res?.data.data ||
      res?.data;
    return items.map(mapper);
  } catch (error: any) {
    if (error?.response.status == 429) {
      console.error(
        "Rate limit exceeded when fetching token prices by category:",
        error
      );
    } else {
      console.error("Error fetching token prices by category:", error);
      throw new APIError(
        "Failed to fetch token prices by category",
        500,
        error
      );
    }
  }
};
