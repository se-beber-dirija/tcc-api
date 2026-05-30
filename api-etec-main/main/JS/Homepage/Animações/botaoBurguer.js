$('document').ready(function () {
    var trigger = $('#hamburger'),
        isClosed = true;

    var sidebar = $('#sidebar');

    trigger.click(function () {
        burgerTime();
        sidebar.toggleClass('collapsed');
    });

    function burgerTime() {
        if (isClosed == true) {
            trigger.removeClass('is-open');
            trigger.addClass('is-closed');
            isClosed = false;
        } else {
            trigger.removeClass('is-closed');
            trigger.addClass('is-open');
            isClosed = true;
        }
    }

});