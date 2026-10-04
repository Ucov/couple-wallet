import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.11:8090');

async function updateSchema() {
    try {
        await pb.admins.authWithPassword('unasev48@gmail.com', 'uVVcOMgRKfr1Rbj2');
        
        const collection = await pb.collections.getOne('chores');
        
        const fieldExists = collection.fields.some(f => f.name === 'is_recurring');
        if (!fieldExists) {
            collection.fields.push({
                hidden: false,
                id: 'bool' + Math.floor(Math.random()*1000000000),
                name: 'is_recurring',
                presentable: false,
                required: false,
                system: false,
                type: 'bool'
            });
            await pb.collections.update('chores', collection);
            console.log('Schema updated successfully!');
        } else {
            console.log('Field already exists.');
        }
    } catch (e) {
        console.error('Error updating schema:', e.message);
    }
}
updateSchema();
