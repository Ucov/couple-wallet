import { pb } from '@/lib/pocketbase'

class SupabaseClientQueryBuilder {
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
    this._filters.push(`${column}~"${value}"`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const prefix = options?.ascending === false ? '-' : '';
    if (column === 'created_at') column = 'created';
    const newOrder = prefix + column;
    this._order = this._order ? this._order + ',' + newOrder : newOrder;
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

  async then(resolve: any, reject: any) {
    try {
      const filterStr = this._filters.join(' && ');
      
      let expandStr = '';
      if (this._select.includes('categories')) expandStr = 'category_id';
      
      if (this._insertData) {
        let res;
        if (Array.isArray(this._insertData)) {
            res = await Promise.all(this._insertData.map((d: any) => this.pb.collection(this.table).create(d)));
        } else {
            res = await this.pb.collection(this.table).create(this._insertData);
        }
        return resolve({ data: res, error: null });
      }

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
            return resolve({ data: res, error: null }); 
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
         const list = await this.pb.collection(this.table).getFullList({
            filter: filterStr || undefined,
            sort: this._order || undefined,
            expand: expandStr || undefined
         });
         
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

export function createClient() {
  const pbInstance = pb;
  
  return {
    auth: {
      getUser: async () => {
        const user = pb.authStore.model;
        return { data: { user } };
      }
    },
    from: (table: string) => {
      return new SupabaseClientQueryBuilder(pbInstance, table);
    },
    channel: (name: string) => {
      const channelObj = {
         on: (event: string, filter: any, callback: any) => {
            // Mock realtime
            return {
               subscribe: () => {
                  // In a real app we'd map this to pb.collection().subscribe
                  try {
                    if (filter.filter && filter.filter.includes('couple_id')) {
                       pb.collection(filter.table || name).subscribe('*', function (e: any) {
                          callback({ new: e.record });
                       });
                    }
                  } catch(e) {}
                  return channelObj;
               },
               send: (payload: any) => {}
            }
         },
         send: (payload: any) => {},
         subscribe: () => channelObj
      };
      return channelObj;
    },
    removeChannel: (channel: any) => {
       try {
         pb.collection('*').unsubscribe();
       } catch(e) {}
    }
  } as any;
}
