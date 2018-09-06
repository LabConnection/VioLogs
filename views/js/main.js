$('#from_date').datetimepicker({});
$('#to_date').datetimepicker({});
class Logs {
    constructor() {
        this._setup();
    }
    _setup() {
        var self = this;
        self._current_Scroll = 0;
        self._current_View_logs = [];
        self._allLogs = [];
        self._currentLimit = 50;
        self._scroller = $("#log_entrys");
        self._ScrollCalled = false;
        $("#log_entrys").scroll(function() {
            self.scroll();
        });
        self._filter = {
            string: "",
            from_date: null,
            to_date: null,
        }
    }
    scroll() {
        var self = this;
        console.log("$(self._scroller).scrollTop()", $(self._scroller).scrollTop());
        if ($(self._scroller).scrollTop() + $(self._scroller).innerHeight() >= $(self._scroller)[0].scrollHeight) {
            console.log("scroll reach")
            if ((self._current_View_logs.length >= self._currentLimit) && (self._ScrollCalled == false)) {
                console.log("raise limit");
                self._currentLimit += 50;
                self._ScrollCalled = true;
                self.refresh();
            }
        }
        self.refreshView();
    }
    refreshView() {
        var self = this;
        $("#log_entrys").html("");
        var sample_html = '<div class="message"><div class="timestamp">[TIMESTAMP]</div><div class="content">[CONTENT]</div></div>'
        self._current_View_logs.forEach(function(entry) {
            $("#log_entrys").append(sample_html.replace("[TIMESTAMP]", new Date(entry.timestamp).toLocaleDateString() + " - " + new Date(entry.timestamp).toLocaleTimeString()).replace("[CONTENT]", entry.string));
        })
    }
    refresh() {
        var self = this;
        self._ScrollCalled = false;
        let i = 0;
        let viewable = [];
        self._allLogs.forEach(function(e) {
            if (i < self._currentLimit) {
                let view = 1;
                let msg = e.string.trim();
                let timestamp = new Date(e.timestamp);
                if ((self._filter.from_date != null) && (self._filter.to_date != null)) {
                    if (self._filter.from_date.getTime() < self._filter.to_date.getTime()) {
                        if ((self._filter.from_date.getTime() >= timestamp.getTime()) || (self._filter.to_date.getTime() <= timestamp.getTime())) {
                            view = 0;
                        } else {
                            view = 1;
                        }
                    }
                }
                if ((msg.toLowerCase().indexOf(self._filter.string.toLowerCase()) == -1) && (view == 1)) {
                    view = 0;
                }
                if (view == 1) {
                    viewable.push(e)
                    i += 1;
                }
            }
        });
        self._current_View_logs = viewable
        console.log("self._current_View_logs", self._current_View_logs)
    }
    filter() {
        console.log("filter");
        var self = this;
        self._currentLimit = 50;
        let string = $("#log_text_search").val();
        let from_date = new Date($('#from_date').val());
        let to_date = new Date($('#to_date').val());
        self._filter.string = string;
        if (($('#from_date').val() != "") && ($('#from_date').val() != "")) {
            self._filter.from_date = from_date;
            self._filter.to_date = to_date;
        }
        console.log(self._filter);
        self.refresh();
        self.refreshView();
    }
    loadLogs(logs) {
        var self = this;
        self._allLogs = logs;
        self.refresh();
        self.refreshView()
    }
}
Logs = new Logs();
$("#filter").on("click", function() {
    Logs.filter();
})
$(document).ready(function() {
    var logger = $("#logger_type").text();
    $.get("../logs_data/" + logger, function(data) {
        console.log(data);
        Logs.loadLogs(data.logs);
    })
});
// localhost:7463/logs_data/VehicleLogger