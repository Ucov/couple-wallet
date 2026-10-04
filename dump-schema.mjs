import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.11:8090');
async function dump() {
    await pb.admins.authWithPassword('unasev48@gmail.com', 'uVVcOMgRKfr1Rbj2');
    const col = await pb.collections.getOne('chores');
    console.log(JSON.stringify(col, null, 2));
}
dump();
