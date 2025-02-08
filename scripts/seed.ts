const {PrismaClient} =require("@prisma/client");

const db = new 
PrismaClient();

async function main(){
    try{
        await db.category.createMany({
           data:[
            {name:"Famous People"},
            {name:"Movie & Tv"},
            {name:"Musicians"},
            {name:"Games"},
            {name:"Animals"},
            {name:"philosophy"},
            {name:"Scientists"},
           ] 
        })

    }catch(error){
        console.log("Error seeding category",error);
    }finally{
        await db.$disconnect();
    }
};

main();
