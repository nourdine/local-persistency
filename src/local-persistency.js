var LocalPersistency = (function() {

   "use strict";

   function sortByPrimaryKeyAsc(a, b) {
      var pkeyA = a.pkey,
         pkeyB = b.pkey;
      if (pkeyA < pkeyB) {
         return -1;
      } else if (pkeyA > pkeyB) {
         return 1;
      }
      return 0;
   }

   function sortByPrimaryKeyDesc(a, b) {
      var pkeyA = a.pkey,
         pkeyB = b.pkey;
      if (pkeyA < pkeyB) {
         return 1;
      } else if (pkeyA > pkeyB) {
         return -1;
      }
      return 0;
   }

   var cache = {
   };

   /**
    * @constructor
    * @param {String} name The table name
    */
   var Table = function(name) {
      this._name = name;
      this._maxPrimaryKey = localStorage.getItem(this._getFullyQualifiedKeyOfMaxPrimaryKey());
      if (this._maxPrimaryKey) {
         this._maxPrimaryKey = parseInt(this._maxPrimaryKey);
      } else {
         this._resetMaxPrimaryKey();
      }
   };

   var klass = Table;

   /**
    * Create a record.
    * 
    * @param {Mixed} data
    * @return {Number} The automatically associated primary key
    */
   klass.prototype.create = function(data) {
      this._incrementMaxPrimaryKey();
      localStorage.setItem(this._name + ":" + this._maxPrimaryKey, JSON.stringify(data));
      return this._maxPrimaryKey;
   };

   /**
    * Retrieve a record.
    * 
    * @param {Number} pkey
    * @return {Mixed}
    */
   klass.prototype.read = function(pkey) {
      return JSON.parse(localStorage.getItem(this._name + ":" + pkey));
   };

   /**
    * Update a record.
    * 
    * @param {Number} pkey
    * @param {Mixed} data
    */
   klass.prototype.update = function(pkey, data) {
      localStorage.setItem(this._name + ":" + pkey, JSON.stringify(data));
   };

   /**
    * @param {Number} pkey Remove the corresponding row.
    */
   klass.prototype.delete = function(pkey) {
      if (pkey === "max") {
         throw new Error("You cannot delete this key. It is for internal usage only!");
      }
      localStorage.removeItem(this._name + ":" + pkey);
   };

   /**
    * Retrieve a slot or records
    * 
    * @param {Number} offset
    * @param {Number} howMany
    * @param {Mixed} orderBy (asc|desc|function)
    * @returns {Array(Object)}
    * 
    * Return an array of objects in the form of:
    * 
    * [{
    *    pkey: 0,
    *    data: mixed
    * }, {
    *    pkey: 1,
    *    data: mixed
    * }]
    */
   klass.prototype.slot = function(offset, howMany, orderBy) {

      var copy = [];
      for (var i = 0; i < localStorage.length; i++) {
         var key = localStorage.key(i);
         if (this._isAKeyOfTheTable(key) && key !== this._getFullyQualifiedKeyOfMaxPrimaryKey()) {
            copy.push({
               "pkey": parseInt(this._extractPrimaryKeyFromFullyQualifiedKey(key)),
               "data": JSON.parse(localStorage[key])
            });
         }
      }

      if (orderBy === "asc") {
         copy.sort(sortByPrimaryKeyAsc);
      } else if (orderBy === "desc") {
         copy.sort(sortByPrimaryKeyDesc);
      } else if (typeof orderBy === "function") {
         copy.sort(function(a, b) {
            return orderBy(a.data, b.data);
         });
      } else {
         throw new Error("Either `asc`, `desc` or a comparator");
      }

      return copy.splice(offset, howMany);
   };

   /**
    * @return {Number} The number of elements in the table.
    */
   klass.prototype.count = function() {
      var counter = 0;
      for (var p in localStorage) {
         if (this._isAKeyOfTheTable(p)) {
            counter++;
         }
      }
      counter--; // this removes the table_name:max from the total
      return counter;
   };

   /**
    * Truncate the table but does not reset the max primary key to be used with the next insert (like in a real db)
    */
   klass.prototype.truncate = function() {
      for (var p in localStorage) {
         if (p !== this._getFullyQualifiedKeyOfMaxPrimaryKey() && this._isAKeyOfTheTable(p)) {
            this.delete(this._extractPrimaryKeyFromFullyQualifiedKey(p));
         }
      }
   };

   /**
    * Reset the max primary key to be used with the next insert.
    */
   klass.prototype._resetMaxPrimaryKey = function() {
      this._maxPrimaryKey = -1;
      localStorage.setItem(this._getFullyQualifiedKeyOfMaxPrimaryKey(), this._maxPrimaryKey);
   };

   klass.prototype._incrementMaxPrimaryKey = function() {
      this._maxPrimaryKey = this._maxPrimaryKey + 1;
      localStorage.setItem(this._getFullyQualifiedKeyOfMaxPrimaryKey(), this._maxPrimaryKey);
   };

   klass.prototype._getFullyQualifiedKeyOfMaxPrimaryKey = function() {
      return this._name + ":max";
   };

   klass.prototype._extractPrimaryKeyFromFullyQualifiedKey = function(fullyQualifiedKey) {
      return parseInt(fullyQualifiedKey.substring(this._name.length + 1)); // which is the length of the prefix `table-name` + `:`
   };

   klass.prototype._isAKeyOfTheTable = function(key) {
      return key.indexOf(this._name + ":") === 0;
   };

   return {
      table: function(name) {
         if (!cache[name]) {
            cache[name] = new Table(name);
         }
         return cache[name];
      }
   };

})();

if (typeof module !== "undefined") {
   if (module.exports) {
      module.exports = LocalPersistency;
   }
}