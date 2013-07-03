(function(){

    var LABELS = {
        prev: '<',
        next: '>',
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                 'August', 'September', 'October', 'November', 'December']
    };

    //minifier-friendly strings
    var className = 'className';

    // dom helpers

    // minification wrapper for appendChild
    function appendChild(parent, child) {
        parent.appendChild(child);
    }

    // is valid date object?
    function isValidDateObj(d) {
        return !!(d.getTime) && !isNaN(d.getTime());
    }

    // Takes a string 'div.foo' and returns the Node <div class="foo">.
    function makeEl(s) {
        var a = s.split('.');
        var tag = a.shift();
        var el = document.createElement(tag);
        if (tag == 'a') {
          el.href = 'javascript:;';
        }
        el[className] = a.join(' ');
        return el;
    }

    // places e1 below e2
    function attachTo(e1, e2) {
        e1.style.left = getLeft(e2) + 'px';
        e1.style.top = getTop(e2) + e2.offsetHeight + 'px';
    }   

    // Recursively determine offsetLeft.
    function getLeft(el) {
        if(el.getBoundingClientRect){
          return el.getBoundingClientRect().left;
        }
        else if (el.offsetParent) {
          return getLeft(el.offsetParent) + el.offsetLeft;
        } else {
          return el.offsetLeft;
        }
    }

    // Recursively determine offsetTop.
    function getTop(el) {
        if(el.getBoundingClientRect){
          return el.getBoundingClientRect().top;
        }
        else if (el.offsetParent) {
          return getTop(el.offsetParent) + el.offsetTop;
        } else {
          return el.offsetTop;
        }   
    }

    function addClass(el, c) {
        xtag.addClass(el, c);
    }

    function removeClass(el, c) {
        xtag.removeClass(el, c);
    }

    function hasClass(el, c) {
        return xtag.hasClass(el, c);
    }

    // Date utils

    function getYear(d) {
        return d.getUTCFullYear();
    }
    function getMonth(d) {
        return d.getUTCMonth();
    }
    function getDate(d) {
        return d.getUTCDate();
    }

    // Pad a single digit with preceding zeros to be 2 digits long
    function pad2(n) {
        var str = n.toString();
        return ('0' + str).substr(-2);
    }

    // ISO Date formatting (YYYY-MM-DD)
    function iso(d) {
        return [getYear(d),
                pad2(getMonth(d)+1),
                pad2(getDate(d))].join('-');
    }

    // parse for YYYY-MM-DD format
    var isoDateRegex = /(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;
    function fromIso(s){
        if (s instanceof Date) return s;
        var d = isoDateRegex.exec(s);
        if (d) {
          return new Date(d[1],d[2]-1,d[3]);
        }
    }

    function parseDate(dateStr){
        if(dateStr instanceof Date) return dateStr;

        var parsedMs = Date.parse(dateStr);
        if(!isNaN(parsedMs)){
            return new Date(parsedMs);
        }
        else{
            // cross-browser check for subset of ISO format that is not natively
            // supported by Date.parse in some older browsers
            var isoParsed = fromIso(dateStr);
            if(isoParsed){
                return isoParsed;
            }
            return null;
        }
    }

    // Create a new date based on the provided date.
    function from(base, y, m, d) {
        if (y === undefined) y = getYear(base);
        if (m === undefined) m = getMonth(base);
        if (d === undefined) d = getDate(base);
        return new Date(y,m,d);
    }

    // get the date with the given offsets from the base date
    function relOffset(base, y, m, d) {
        return from(base,
                    getYear(base) + y,
                    getMonth(base) + m,
                    getDate(base) + d);
    }

    // Find the nearest preceding Sunday.
    function findSunday(d) {
        while(d.getUTCDay() > 0) {
          d = prevDay(d);
        }
        return d;
    }

    // Find the first of the date's month.
    function findFirst(d) {
        while(getDate(d) > 1) {
          d = prevDay(d);
        }
        return d;
    }

    // Return the next day.
    function nextDay(d) {
        return relOffset(d, 0, 0, 1);
    }

    // Return the previous day.
    function prevDay(d) {
        return relOffset(d, 0, 0, -1);
    }

    // Check whether Date `d` is in the list of Date/Date ranges in `matches`.
    function dateMatches(d, matches) {
        if (!matches) return;
        matches = (matches.length === undefined) ? [matches] : matches;
        var foundMatch = false;
        matches.forEach(function(match) {
          if (match.length == 2) {
            if (dateInRange(match[0], match[1], d)) {
              foundMatch = true;
            }
          } else {
            if (iso(match) == iso(d)) {
              foundMatch = true;
            }
          }
        });
        return foundMatch;
    }

    function dateInRange(start, end, d) {
        // convert to strings for easier comparison
        return iso(start) <= iso(d) && iso(d) <= iso(end);
    }

    // creates the html elements for a given date, highlighting the
    // given selected date ranges
    function makeMonth(d, selected) {
        if (!isValidDateObj(d)) throw 'Invalid cursor date!';
        var month = getMonth(d);
        var tdate = getDate(d)
        var sDate = findSunday(findFirst(d));

        var monthEl = makeEl('div.month');

        var label = makeEl('div.label');
        label.textContent = LABELS.months[month] + ' ' + getYear(d);

        appendChild(monthEl, label);

        var week = makeEl('div.week');

        var cDate = sDate;

        var done = false;

        while(!done) {
          var day = makeEl('a.day');
          day.setAttribute('data-date', iso(cDate));
          day.textContent = getDate(cDate);
          if (getMonth(cDate) != month) {
            addClass(day, 'badmonth');
          }
          if (dateMatches(cDate, selected)) {
            addClass(day, 'sel');
          }
          appendChild(week, day);
          cDate = nextDay(cDate);
          if (cDate.getUTCDay() < 1) {
            appendChild(monthEl, week);
            week = makeEl('div.week');
            // Are we finished drawing the month?
            // Checks month rollover and year rollover
            done = getMonth(cDate) > month || (getMonth(cDate) < month && getYear(cDate) > getYear(sDate));
          }
        }

        return monthEl;
    }

    function makeControls() {
        var controls = makeEl('div.controls');
        var prev = makeEl('a.prev');
        var next = makeEl('a.next');
        prev.innerHTML = LABELS['prev'];
        next.innerHTML = LABELS['next'];
        appendChild(controls, prev);
        appendChild(controls, next);
        return controls;
    }

    /**

    params:
        o            (optional) a data map of the following optional properties:
                        - span             the number of months to display
                        - cursor           the date to center the display on
    **/
    function Calendar(o) {
        var o = o || {};
        var self = this;
        self._span = o.span || 1;
        self._cursor = o.cursor || new Date();

        // TODO: modify this holdover from fortnight.js to fit component
        self._selected = o.selected || []; // a list of [date, date] ranges


        self.el = makeEl('div.calendar');

        self.render();
    }

    Calendar.prototype.render = function(){
        var span = this._span;
        this.el.innerHTML = "";
        // get first month of the span of months centered on the cursor
        var ref = relOffset(this._cursor, 0, -Math.floor(span/2), 0);
        for (var i=0; i<span; i++) {
            appendChild(this.el, makeMonth(ref, this._selected));
            // get next month's date
            ref = relOffset(ref, 0, 1, 0);
        }
    };

    Object.defineProperties(Calendar.prototype, {
        "span":{
            get: function(){
                return this._span;
            },
            set: function(newSpan){
                this._span = newSpan;
                this.render();
            }
        },
        "cursor":{
            attribute: {},
            get: function(){
                return this._cursor;
            },
            set: function(newCursorDate){
                this._cursor = newCursorDate;
                this.render();
            }
        },
        "selected": {
            get: function(){
                return this._selected;
            },
            set: function(newSelected){
                this._selected = newSelected;
                this.render();
            }
        }
    });


    xtag.register("x-calendar", {
        lifecycle: {
            created: function(){
                this.innerHTML = "";

                this.xtag.calObj = new Calendar();

                appendChild(this, this.xtag.calObj.el);
                // append after calendar to use natural stack order instead of 
                // needing explicit z-index
                appendChild(this, makeControls());
            },
            inserted: function(){
                this.render();
            }
        },
        events: {
            "tap:delegate(.next)": function(e){
                var xCalendar = e.currentTarget;
                xCalendar.nextMonth();

                xtag.fireEvent(xCalendar, "nextmonth");
            },
            "tap:delegate(.prev)": function(e){
                var xCalendar = e.currentTarget;
                xCalendar.prevMonth();

                xtag.fireEvent(xCalendar, "prevmonth");
            },
            "tap:delegate(.day)": function(e){
                var xCalendar = e.currentTarget;
                var day = this;
                var date = day.getAttribute("data-date");
                xCalendar.selectDate(date);

                xtag.fireEvent(xCalendar, "dateselect");
            }
        },
        accessors: {
            controls:{
                attribute: {boolean: true}
            },
            span:{
                attribute: {},
                get: function(){
                    return this.xtag.calObj.span;
                },
                set: function(newCalSpan){
                    this.xtag.calObj.span = newCalSpan;
                }
            },
            cursor: {
                attribute: {},
                get: function(){
                    return this.xtag.calObj.cursor;
                },
                set: function(newCursor){
                    if(isValidDateObj(newCursor)){
                       this.xtag.calObj.cursor = newCursor;
                       xtag.fireEvent(this, "dateselect");
                    }
                    else{
                        var parsedDate = parseDate(newCursor);
                        if(parsedDate){
                            this.xtag.calObj.cursor = parsedDate;
                            xtag.fireEvent(this, "dateselect");
                        }
                    }
                }
            }
        },
        methods: { 
            render: function(){
                this.xtag.calObj.render();
            },
            // Go back one month.
            prevMonth: function(){
                var calObj = this.xtag.calObj;
                calObj.cursor = relOffset(calObj.cursor, 0, -1, 0);
            },
            // Advance one month forward.
            nextMonth: function(){
                var calObj = this.xtag.calObj;
                calObj.cursor = relOffset(calObj.cursor, 0, 1, 0);
            },
            selectDate: function(newDate){
                console.log("selectedDate not yet fully implemented, but we selected", newDate);
            }
        }
    });

})();