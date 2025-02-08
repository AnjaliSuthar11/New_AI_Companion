import { Pinecone } from '@pinecone-database/pinecone';
import {PineconeStore} from "@langchain/pinecone";
import {OpenAIEmbeddings} from "@langchain/openai";
import { Redis } from '@upstash/redis';


export type CompanionKey={
  companionName:string,
  modelName:string,
  userId:string;
};

export class MemoryManager{
  private static instance:MemoryManager;
  private history:Redis;
  private vectorDBClient:Pinecone;

  public constructor(){
    this.history=Redis.fromEnv();
    this.vectorDBClient=new Pinecone({
      apiKey : process.env.PINECONE_API_KEY!
    });
 
  }

  public async init(){
      if(this.vectorDBClient ){
        console.log("Pinecone client initialized API key",process.env.PINECONE_API_KEY)
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


const vectorStore = await PineconeStore.fromExistingIndex(
  new OpenAIEmbeddings({openAIApiKey:process.env.OPENAI_API_KEY}),
  {pineconeIndex}
);

try{
  const similarDocs = await vectorStore.similaritySearch(recentChatHistory,3,{fileName:companionFileName});
  return similarDocs;
}catch(err:unknown){
  if(err instanceof Error){
    console.log("failed to get vector serach result",err.message)
  }else{
    console.log("An unknown error occured",err);
  }
  return [];
}

// const similarDocs=await vectorStore
//       .similaritySearch(recentChatHistory,3,{fileName:companionFileName})
//       .catch((err)=>{
//            console.log("failed to get vector search results",err);
//            return []
// });
//   return similarDocs;
}

    public static async getInstance():Promise<MemoryManager>{
      if(!MemoryManager){
          MemoryManager.instance=new MemoryManager();
          await MemoryManager.instance.init();
      }
      return MemoryManager.instance;
    }

    private generateRedisCompanionKey(CompanionKey:CompanionKey):string{
      return `${CompanionKey.companionName}-${CompanionKey.modelName}-${CompanionKey.userId}`
    }

    public async writeToHistory(text:string,CompanionKey:CompanionKey){
      if(!CompanionKey || typeof CompanionKey.userId=="undefined"){
        console.log("Companion Key set incorrectly");
        return "";
      }
      const key= this.generateRedisCompanionKey(CompanionKey);
      const result = await this.history.zadd(key,{
        score:Date.now(),
        member:text,
      });
      return result;
    }
    public async readLatestHistory(companionKey:CompanionKey):Promise<string>{
        if(!companionKey || typeof companionKey.userId == "undefined"){
          console.log("Companion key set incorrectly");
          return "";
        }

        const key=this.generateRedisCompanionKey(companionKey);
        let result = await this.history.zrange(key,0,Date.now(),{
          byScore:true,
        });

        result= result.slice(-30).reverse();
        const recentChats = result.reverse().join("\n");
        return recentChats;
    }

    public async seedChatHistory(
      seedContent:String,
      delimiter:string="\n",
      companionKey:CompanionKey)
      {
        const key=this.generateRedisCompanionKey(companionKey)

        if(await this.history.exists(key)){
          console.log("user already has chat history");
          return;
        }

        const content = seedContent.split(delimiter);
        let counter=0;

        for (const line of content){
          await this.history.zadd(key,{score:counter,member:line});
          counter += 1;

        }

      }
}

