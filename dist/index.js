var $=Object.create;var E=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var V=Object.getPrototypeOf,U=Object.prototype.hasOwnProperty;var N=(t,o,e,n)=>{if(o&&typeof o=="object"||typeof o=="function")for(let i of O(o))!U.call(t,i)&&i!==e&&E(t,i,{get:()=>o[i],enumerable:!(n=L(o,i))||n.enumerable});return t};var h=(t,o,e)=>(e=t!=null?$(V(t)):{},N(o||!t||!t.__esModule?E(e,"default",{value:t,enumerable:!0}):e,t));var R=h(require("express"));var d=require("oceanic.js");var m=h(require("sqlite3")),b=require("sqlite"),a;async function T(){a=await(0,b.open)({filename:"./database.db",driver:m.default.Database}),console.log("Database opened"),await a.exec(`
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            isUpdate BOOLEAN NOT NULL,
            minVersion INTEGER NOT NULL,
            maxVersion INTEGER NOT NULL,
            published BOOLEAN NOT NULL
        )
    `)}var f="## Make a draft\n```\n!draft (--update)\n<min version>\n<max version>\n<title>\n<text>\n```\n## View announcements\n`!ls` `!drafts` `!published`\n## Manage announcements\n`!rm <id>` `!publish <id>` `!unpublish <id>`\n## Other\n`!ping` `!build`";var l=new d.Client({auth:`Bot ${process.env.TOKEN}`,gateway:{intents:d.AllIntents}});l.on("ready",()=>{console.log("Discord connected as",l.user.tag)});l.on("messageCreate",async t=>{if(t.author.id!==l.user.id&&t.content.startsWith("!")){let o=t.content.split(/( |\n)/)[0].replace("!","");switch(o){case"help":{await t.channel?.createMessage({content:f});break}case"ping":{await t.channel?.createMessage({content:"Pong!"});break}}if(t.author.id!=="886685857560539176")return;switch(o){case"draft":{let e=t.content.split(`
`);if(e.length<5)return;let n=!1;e[0].toLowerCase().includes("--update")&&(n=!0),e.shift();let i=e[2],r=e[0],c=e[1];e.shift(),e.shift(),e.shift();let s=e.join(`
`),u=await a.run("INSERT INTO announcements (title, text, isUpdate, minVersion, maxVersion, published) VALUES (?, ?, ?, ?, ?, ?)",i,s,n,r,c,!1);await t.channel?.createMessage({embeds:[{title:"Announcement created",description:`Title: ${i}
Text: ${s}
Is update: ${n}
Min version: ${r}
Max version: ${c}

-# Use \`!drafts\` to view drafts`}]});break}case"ls":{let e=await a.all("SELECT * FROM announcements");await t.channel?.createMessage({embeds:[{title:"All",description:e.map(n=>`${n.published?"\u{1F30E}":"\u{1F511}"} ID: ${n.id}
Title: ${n.title}
Text: ${n.text}
Is update: ${n.isUpdate}
Min version: ${n.minVersion}
Max version: ${n.maxVersion}`).join(`

`)}]});break}case"drafts":{let e=await a.all("SELECT * FROM announcements WHERE published = false");await t.channel?.createMessage({embeds:[{title:"Drafts",description:e.map(n=>`ID: ${n.id}
Title: ${n.title}
Text: ${n.text}
Is update: ${n.isUpdate}
Min version: ${n.minVersion}
Max version: ${n.maxVersion}`).join(`

`)}]});break}case"published":{let e=await a.all("SELECT * FROM announcements WHERE published = true");await t.channel?.createMessage({embeds:[{title:"Published",description:e.map(n=>`ID: ${n.id}
Title: ${n.title}
Text: ${n.text}
Is update: ${n.isUpdate}
Min version: ${n.minVersion}
Max version: ${n.maxVersion}`).join(`

`)}]});break}case"rm":{let e=t.content.split(" ")[1];if(!e)return;await a.run("DELETE FROM announcements WHERE id = ?",e),await t.channel?.createMessage({content:"Draft removed"});break}case"edit":{let e=t.content.split(/( |\n)/)[2];if(console.log(e),!e)return;let n=await a.get("SELECT * FROM announcements WHERE id = ?",e);if(!n)return;let i=t.content.split(`
`);if(i.length<5)return;let r=n.isUpdate;i.shift();let c=i[2],s=i[0],u=i[1];i.shift(),i.shift(),i.shift();let p=i.join(`
`);await a.run("UPDATE announcements SET title = ?, text = ?, isUpdate = ?, minVersion = ?, maxVersion = ? WHERE id = ?",c,p,r,s,u,e),await t.channel?.createMessage({embeds:[{title:"Announcement updated",description:`Title: ${c}
Text: ${p}
Is update: ${r}
Min version: ${s}
Max version: ${u}`}]});break}case"publish":{let e=t.content.split(" ")[1];if(!e)return;let n=await a.get("SELECT * FROM announcements WHERE id = ?",e);if(!n)return;await a.run("UPDATE announcements SET published = true WHERE id = ?",e),await t.channel?.createMessage({content:`Draft published, it will be viewable by all VendroidEnhanced users.${n.isUpdate?" This is an update.":""}`});break}case"unpublish":{let e=t.content.split(" ")[1];if(!e||!await a.get("SELECT * FROM announcements WHERE id = ?",e))return;await a.run("UPDATE announcements SET published = false WHERE id = ?",e),await t.channel?.createMessage({content:"Draft unpublished"});break}case"build":await fetch("https://api.github.com/repos/VendroidEnhanced/plugin/actions/workflows/build.yml/dispatches",{method:"POST",headers:{Authorization:`Bearer ${process.env.GH_TOKEN}`},body:JSON.stringify({ref:"main"})}),t.channel?.createMessage({content:"Building Vencord :rocket:"})}}});async function x(){await l.connect()}var M=(0,R.default)(),w=8637;x();T();process.on("unhandledRejection",(t,o)=>{console.error("Unhandled Rejection at:",o,"reason:",t)});process.on("uncaughtException",t=>{console.error("Uncaught Exception thrown",t),process.exit(1)});M.get("/api/updates",async(t,o)=>{if(!t.query.version)return o.send({version:900,changelog:"Major rework of the update system, settings, and notable fixes. Update to avoid things breaking."});let e=await a.all("SELECT * FROM announcements WHERE published=true AND isUpdate=true ORDER BY id DESC LIMIT 1"),n=await a.all("SELECT * FROM announcements WHERE published=true AND isUpdate=false ORDER BY id DESC"),i=null;(()=>{if(e.length>0){let s=t.query.version;if((e[0].minVersion===0||e[0].minVersion<s)&&(e[0].maxVersion===0||e[0].maxVersion>s)){i={title:e[0].title,text:e[0].text};return}}})();let r=[],c=t.query.version;r=n.filter(s=>(s.minVersion===0||s.minVersion<c)&&(s.maxVersion===0||s.maxVersion>c)).map(s=>({id:s.id,title:s.title,text:s.text})),o.json({update:i,announcements:r})});M.listen(w,()=>{console.log("\u{1F680} Listening on port "+w)});
