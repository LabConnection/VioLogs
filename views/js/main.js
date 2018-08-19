
    $('#from_date').datetimepicker({});
    $('#to_date').datetimepicker({});

    function filter() {
        let string = $("#log_text_search").val();
        let from_date = new Date($('#from_date').val());
        let to_date = new Date($('#to_date').val());
        $("#log_entrys .message").each(function(i, x) {
            let show = 1;
            let msg = $(x).find(".content").text().trim();
            let timestamp = new Date($($(x).find(".timestamp")).attr("date"));
            if (($('#from_date').val() != "") && ($('#from_date').val() != "")) {
                if (from_date.getTime() < to_date.getTime()) {
                    if ((from_date.getTime() >= timestamp.getTime()) || (to_date.getTime() <= timestamp.getTime())) {
                        show = 0;
                    } else {
                        show = 1;
                    }
                }
            }
            if (msg.toLowerCase().indexOf(string.toLowerCase()) == -1) {
                show = 0;
            }
            if (show == 0) {
                $(x).hide();
            } else {
                $(x).show();
            }
        });
    }
    $("#filter").on("click", function() {
        filter()
    })
