describe("The local persistency manager", function() {

   var todos;
   var cars;

   function addElevenItemsToEachTable() {
      todos.create("a");
      cars.create(1);
      todos.create("b");
      cars.create(2);
      todos.create("c");
      cars.create(3);
      todos.create("d");
      cars.create(4);
      todos.create("e");
      cars.create(5);
      todos.create("f");
      cars.create(6);
      todos.create("g");
      cars.create(7);
      todos.create("h");
      cars.create(8);
      todos.create("i");
      cars.create(9);
      todos.create("l");
      cars.create(10);
      todos.create("m");
      cars.create(11);
   }

   beforeEach(function() {
      LocalPersistency.table("todos").truncate();
      LocalPersistency.table("todos")._resetMaxPrimaryKey();
      LocalPersistency.table("cars").truncate();
      LocalPersistency.table("cars")._resetMaxPrimaryKey();
      todos = LocalPersistency.table("todos");
      cars = LocalPersistency.table("cars");
   });

   afterEach(function() {
      localStorage.clear();
   });

   it("sets the max index of a table to -1 on creation", function() {
      expect(todos._maxPrimaryKey).toBe(-1);
   });

   it("offers an idempotent table retrieval mechanism", function() {
      expect(todos === LocalPersistency.table("todos")).toBe(true);
   });

   it("can CREATE data", function() {
      var pkey = todos.create("a");
      expect(pkey).toBe(0);
      expect(todos.count()).toBe(1);
      expect(todos._maxPrimaryKey).toBe(0);
   });

   it("can READ records", function() {
      todos.create("a");
      expect(todos.read(0)).toBe("a");
      expect(todos.count()).toBe(1);
      expect(todos._maxPrimaryKey).toBe(0);
   });

   it("can UPDATE records", function() {
      todos.create("a");
      expect(todos.read(0)).toBe("a");
      todos.update(0, "b");
      expect(todos.read(0)).toBe("b");
      expect(todos.count()).toBe(1);
      expect(todos._maxPrimaryKey).toBe(0);
   });

   it("can DELETE records", function() {
      var pkey = todos.create("a");
      expect(todos.read(pkey)).toBe("a");
      expect(todos.count()).toBe(1);
      expect(todos._maxPrimaryKey).toBe(0);
      todos.delete(pkey);
      expect(todos.read(pkey)).toBeNull();
      expect(todos.count()).toBe(0);
      expect(todos._maxPrimaryKey).toBe(0);
   });

   it("keeps track of the number of inserted records and auto increment the primary keys accordingly", function() {
      todos.create("a");
      todos.create("b");
      expect(todos.count()).toBe(2);
      expect(todos._maxPrimaryKey).toBe(1);
   });

   it("performs JSON encoding/decoding automatically", function() {
      var todo = {
         what: "go to the pool",
         when: "tomorrow"
      };
      todos.create(todo);
      var retrieved = todos.read(0);
      expect(retrieved instanceof Object).toBe(true);
      expect(retrieved.what).toBe(todo.what);
      expect(retrieved.when).toBe(todo.when);
   });

   it("can TRUNCATE a table contents", function() {
      todos.create("a");
      todos.create("b");
      expect(todos.count()).toBe(2);
      todos.truncate();
      expect(todos.count()).toBe(0);
      expect(todos._maxPrimaryKey).toBe(1);
      todos.create("c");
      expect(todos.count()).toBe(1);
      expect(todos._maxPrimaryKey).toBe(2);
   });

   it("can perform TRUNCATE operations on multiple tables", function() {
      todos.create("a");
      cars.create("x");
      expect(todos.count()).toBe(1);
      expect(cars.count()).toBe(1);
      todos.truncate();
      expect(todos.count()).toBe(0);
      expect(cars.count()).toBe(1);
      todos.create("b");
      cars.create("y");
      expect(todos.count()).toBe(1);
      expect(cars.count()).toBe(2);
      expect(todos._maxPrimaryKey).toBe(1);
      expect(cars._maxPrimaryKey).toBe(1);
   });

   it("can retrive a slot of records in ASC order", function() {
      // 0 1 2 3 4 5 6 7 8 9 10
      // a b c d e f g h i l m  
      addElevenItemsToEachTable();
      var res = todos.slot(0, 2, "asc");
      expect(res.length).toBe(2);
      expect(res[0].pkey).toBe(0);
      expect(res[0].data).toBe("a");
      expect(res[1].pkey).toBe(1);
      expect(res[1].data).toBe("b");
      var res = todos.slot(1, 2, "asc");
      expect(res.length).toBe(2);
      expect(res[0].pkey).toBe(1);
      expect(res[0].data).toBe("b");
      expect(res[1].pkey).toBe(2);
      expect(res[1].data).toBe("c");
   });

   it("can retrive a slot of records in ASC order and be consistent \n\
         with previous deletions", function() {
      // 0 1 2 3 4 5 6 7 8 9 10
      // a b c d e f g h i l m  
      addElevenItemsToEachTable();
      todos.delete(1);
      var res = todos.slot(0, 2, "asc");
      expect(res.length).toBe(2);
      expect(res[0].pkey).toBe(0);
      expect(res[0].data).toBe("a");
      expect(res[1].pkey).toBe(2);
      expect(res[1].data).toBe("c");
   });

   it("can retrive a slot of records in ASC order (edge cases)", function() {
      // 0 1 2 3 4 5 6 7 8 9 10
      // a b c d e f g h i l m  
      addElevenItemsToEachTable();
      var res = todos.slot(0, 12, "asc");
      expect(res.length).toBe(todos.count());
      var res = todos.slot(10, 1, "asc");
      expect(res.length).toBe(1);
      expect(res[0].pkey).toBe(10);
      expect(res[0].data).toBe("m");
      var res = todos.slot(10, 2, "asc");
      expect(res.length).toBe(1);
      expect(res[0].pkey).toBe(10);
      expect(res[0].data).toBe("m");
      var res = todos.slot(11, 1, "asc");
      expect(res.length).toBe(0);
   });

   it("can retrive a slot of records in DESC order", function() {
      // 0 1 2 3 4 5 6 7 8 9 10
      // m l i h g f e d c b a  
      addElevenItemsToEachTable();
      var res = todos.slot(0, 2, "desc");
      expect(res.length).toBe(2);
      expect(res[0].pkey).toBe(10);
      expect(res[0].data).toBe("m");
      expect(res[1].pkey).toBe(9);
      expect(res[1].data).toBe("l");
      var res = todos.slot(1, 2, "desc");
      expect(res.length).toBe(2);
      expect(res[0].pkey).toBe(9);
      expect(res[0].data).toBe("l");
      expect(res[1].pkey).toBe(8);
      expect(res[1].data).toBe("i");
   });

   it("can retrive a slot of records in DESC order (edge cases)", function() {
      // 0 1 2 3 4 5 6 7 8 9 10
      // m l i h g f e d c b a  
      addElevenItemsToEachTable();
      var res = todos.slot(0, 11, "desc");
      expect(res.length).toBe(todos.count());
      var res = todos.slot(10, 1, "desc");
      expect(res.length).toBe(1);
      expect(res[0].pkey).toBe(0);
      expect(res[0].data).toBe("a");
      var res = todos.slot(10, 2, "desc");
      expect(res.length).toBe(1);
      expect(res[0].pkey).toBe(0);
      expect(res[0].data).toBe("a");
      var res = todos.slot(11, 1, "desc");
      expect(res.length).toBe(0);
   });

   it("can retrive a slot of records sorted in a custom manner", function() {
      personA = {
         name: "zoe",
         age: 37
      };
      personB = {
         name: "nou",
         age: 33
      };
      todos.create(personA);
      todos.create(personB);
      var res = todos.slot(0, 2, function(a, b) {
         if (a.name < b.name)
            return -1;
         if (a.name > b.name)
            return 1;
         return 0;
      });
      expect(res[0].data.name).toBe("nou");
   });

});