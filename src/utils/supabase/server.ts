import { getServerPB } from '@/lib/pocketbase-server'

class SupabaseQueryBuilder {
  pb: any;
  table: string;
  _select: string = '*';
  _filters: string[] = [];
  _order: string = '';
  _single: boolean = false;
  _maybeSingle: boolean = false;
  _insertData: any = null;
  _updateData: any = null;
  _delete: boolean = false;

  constructor(pb: any, table: string) {
    this.pb = pb;
    this.table = table === 'profiles' ? 'users' : table;
  }

  select(s: string = '*') {
    this._select = s;
    return this;
  }

  eq(column: string, value: any) {
    if (value === null) {
        this._filters.push(`${column}=null`);
    } else if (typeof value === 'boolean') {
        this._filters.push(`${column}=${value}`);
    } else {
        this._filters.push(`${column}="${value}"`);
    }
    return this;
  }

  neq(column: string, value: any) {
     this._filters.push(`${column}!="${value}"`);
     return this;
  }

  gte(column: string, value: any) {
    this._filters.push(`${column}>="${value}"`);
    return this;
  }

  lte(column: string, value: any) {
    this._filters.push(`${column}<="${value}"`);
    return this;
  }
  
  ilike(column: string, value: any) {
    this._filters.push(`${column}~"${value}"`); // Pocketbase LIKE is ~
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    // Pocketbase uses - for descending
    const prefix = options?.ascending === false ? '-' : '';
    // Map created_at to created
    if (column === 'created_at') column = 'created';
    const newOrder = prefix + column; this._order = this._order ? this._order + "," + newOrder : newOrder;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  insert(data: any) {
    this._insertData = data;
    return this;
  }

  update(data: any) {
    this._updateData = data;
    return this;
  }

  delete() {
    this._delete = true;
    return this;
  }
  
  contains(column: string, data: any) {
    // Ignore for now, used in deleteSubscription but we rewrote that
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const filterStr = this._filters.join(' && ');
      
      let expandStr = '';
      if (this._select.includes('categories')) expandStr = 'category_id';
      
      // Handle insert
      if (this._insertData) {
        let res;
        if (Array.isArray(this._insertData)) {
            // Not supported properly but let's loop
            res = await Promise.all(this._insertData.map((d: any) => this.pb.collection(this.table).create(d)));
        } else {
            res = await this.pb.collection(this.table).create(this._insertData);
        }
        return resolve({ data: res, error: null });
      }

      // Handle update/delete (requires id, which we assume is in filter)
      // If doing update/delete we must fetch the records first if ID isn't directly known, but usually eq('id', id)
      let idMatch = this._filters.find(f => f.startsWith('id="'));
      let idToModify = idMatch ? idMatch.split('"')[1] : null;

      if (this._delete) {
         if (idToModify) {
            await this.pb.collection(this.table).delete(idToModify);
            return resolve({ data: null, error: null });
         } else if (filterStr) {
            const list = await this.pb.collection(this.table).getFullList({ filter: filterStr });
            for(const item of list) {
               await this.pb.collection(this.table).delete(item.id);
            }
            return resolve({ data: null, error: null });
         }
      }

      if (this._updateData) {
         if (idToModify) {
            const res = await this.pb.collection(this.table).update(idToModify, this._updateData);
            return resolve({ data: res, error: null });
         } else if (filterStr) {
            const list = await this.pb.collection(this.table).getFullList({ filter: filterStr });
            let res;
            for(const item of list) {
               res = await this.pb.collection(this.table).update(item.id, this._updateData);
            }
            return resolve({ data: res, error: null }); // Returns last one
         }
      }

      let res;
      if (this._single || this._maybeSingle) {
         try {
           res = await this.pb.collection(this.table).getFirstListItem(filterStr, { expand: expandStr });
           if (res && res.expand) {
             if (res.expand.category_id) res.categories = res.expand.category_id;
           }
         } catch(e: any) {
           if (e.status === 404 && this._maybeSingle) {
              res = null;
           } else {
              throw e;
           }
         }
         resolve({ data: res, error: null });
      } else {
         let list;
         try {
           list = await this.pb.collection(this.table).getFullList({
              filter: filterStr || undefined,
              sort: this._order || undefined,
              expand: expandStr || undefined
           });
         } catch(e: any) {
           if(e.status===400) {
              list = await this.pb.collection(this.table).getFullList({
                 filter: filterStr || undefined,
                 expand: expandStr || undefined
              });
           } else throw e;
         }
         const mappedList = list.map((item: any) => {
            if (item.expand && item.expand.category_id) {
               item.categories = item.expand.category_id;
            }
            return item;
         });
         
         resolve({ data: mappedList, error: null });
      }
    } catch(error: any) {
      resolve({ data: null, error });
    }
  }
}

export async function createClient() {
  const pb = await getServerPB();
  
  return {
    auth: {
      getUser: async () => {
        const user = pb.authStore.model;
        return { data: { user } };
      }
    },
    from: (table: string) => {
      return new SupabaseQueryBuilder(pb, table);
    }
  } as any;
}
