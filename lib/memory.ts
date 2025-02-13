import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { Redis } from "@upstash/redis";
import { CohereEmbeddings } from "@langchain/cohere";

export type CompanionKey = {
  companionName: string;
  modelName: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private history: Redis;
  private vectorDBClient: Pinecone;

  public constructor() {
    this.history = Redis.fromEnv();
    this.vectorDBClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  public async init() {
    if (!this.vectorDBClient || !(this.vectorDBClient instanceof Pinecone)) {
      throw new Error("Pinecone client initialization failed");
    }
    if (this.vectorDBClient instanceof Pinecone) {
      console.log(
        "Pinecone client initialized API key",
        process.env.PINECONE_API_KEY
      );
    }
  }

  public async vectorSearch(
    recentChatHistory: string,
    companionFileName: string
  ) {
    const pineconeClient = <Pinecone>this.vectorDBClient;

    const pineconeIndex = pineconeClient.Index(
      process.env.PINECONE_INDEX! || ""
    );

    if (!pineconeIndex) {
      throw new Error("Pinecone index not found");
    }

    const vectorStore = await PineconeStore.fromExistingIndex(
      new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY as string,
        model: "embed-english-v3.0",
      }),
      { pineconeIndex }
    );

    const similarDocs = await vectorStore
      .similaritySearch(recentChatHistory, 3, { fileName: companionFileName })
      .catch((err) => {
        console.log("failed to get vector search results", err);
        return [];
      });
    return similarDocs;
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      // console.log(first)
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
    }
    return MemoryManager.instance;
  }

  private generateRedisCompanionKey(CompanionKey: CompanionKey): string {
    return `${CompanionKey.companionName}-${CompanionKey.modelName}-${CompanionKey.userId}`;
  }

  public async writeToHistory(text: string, CompanionKey: CompanionKey) {
    if (!CompanionKey || typeof CompanionKey.userId == "undefined") {
      console.log("Companion Key set incorrectly");
      return "";
    }
    const key = this.generateRedisCompanionKey(CompanionKey);
    const result = await this.history.zadd(key, {
      score: Date.now(),
      member: text,
    });
    return result;
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly");
      return "";
    }

    const key = this.generateRedisCompanionKey(companionKey);
    let result = await this.history.zrange(key, 0, Date.now(), {
      byScore: true,
    });

    result = result.slice(-30).reverse();
    const recentChats = result.reverse().join("\n");
    return recentChats;
  }

  public async seedChatHistory(
    seedContent: string,
    delimiter: string = "\n",
    companionKey: CompanionKey
  ) {
    const key = this.generateRedisCompanionKey(companionKey);

    if (await this.history.exists(key)) {
      console.log("user already has chat history");
      return;
    }

    const content = seedContent.split(delimiter);
    let counter = 0;

    for (const line of content) {
      await this.history.zadd(key, { score: counter, member: line });
      counter += 1;
    }
  }
}
