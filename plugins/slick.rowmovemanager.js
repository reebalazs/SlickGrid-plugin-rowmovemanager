(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "RowMoveManager": RowMoveManager
    }
  });

  function RowMoveManager(options) {
    var _grid;
    var _canvas;
    var _dragging;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {
      cancelEditOnDrag: false,
      // By default, a move of an unselected row
      // will make that row only as the new selection.
      // Setting this to true will keep the current
      // selection and add the row.
      keepSelectionOnMove: false,
      // By default, a single row is selected when it is dragged.
      // Setting singleStaysSelected to false, will cause a single dragged
      // element unchanged at the end of the operation.
      singleStaysSelected: true,
      // If set to true, it prevents the drop before or after
      // any element that is currently being moved. Although if we do
      // not prevent it, it would work but would lead to a confusing
      // result. - This is an extension to the previous version of
      // this plugin, so the default is to follow the same behavior.
      preventDroppingOnSelf: false
    };

    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _canvas = _grid.getCanvasNode();
      _handler
        .subscribe(_grid.onDragInit, handleDragInit)
        .subscribe(_grid.onDragStart, handleDragStart)
        .subscribe(_grid.onDrag, handleDrag)
        .subscribe(_grid.onDragEnd, handleDragEnd);
      if (options.preventDroppingOnSelf) {
        _handler.subscribe(this.onBeforeMoveRows, handleBeforeMoveRows);
      }
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function handleDragInit(e, dd) {
      // prevent the grid from cancelling drag'n'drop by default
      e.stopImmediatePropagation();
    }

    function handleDragStart(e, dd) {
      var cell = _grid.getCellFromEvent(e);

      if (options.cancelEditOnDrag && _grid.getEditorLock().isActive()) {
        _grid.getEditorLock().cancelCurrentEdit();
      }

      if (_grid.getEditorLock().isActive() || !/move|selectAndMove/.test(_grid.getColumns()[cell.cell].behavior)) {
        return false;
      }

      _dragging = true;
      e.stopImmediatePropagation();

      var selectedRows = _grid.getSelectedRows();

      dd.noInitialSelection = selectedRows.length === 0;
      if (dd.noInitialSelection || $.inArray(cell.row, selectedRows) == -1) {
        if (! options.keepSelectionOnMove) {
          selectedRows = [];
        }
        selectedRows.push(cell.row);
        _grid.setSelectedRows(selectedRows);
      }

      var rowHeight = _grid.getOptions().rowHeight;

      dd.selectedRows = selectedRows;

      dd.selectionProxy = $("<div class='slick-reorder-proxy'/>")
          .css("position", "absolute")
          .css("zIndex", "99999")
          .css("width", $(_canvas).innerWidth())
          .css("height", rowHeight * selectedRows.length)
          .appendTo(_canvas);

      dd.guide = $("<div class='slick-reorder-guide'/>")
          .css("position", "absolute")
          .css("zIndex", "99998")
          .css("width", $(_canvas).innerWidth())
          .css("top", -1000)
          .appendTo(_canvas);

      dd.insertBefore = -1;
    }

    function handleDrag(e, dd) {
      if (!_dragging) {
        return;
      }

      e.stopImmediatePropagation();

      var top = e.pageY - $(_canvas).offset().top;
      dd.selectionProxy.css("top", top - 5);

      var insertBefore = Math.max(0, Math.min(Math.round(top / _grid.getOptions().rowHeight), _grid.getDataLength()));
      if (insertBefore !== dd.insertBefore) {
        var eventData = {
          "rows": dd.selectedRows,
          "insertBefore": insertBefore
        };

        if (_self.onBeforeMoveRows.notify(eventData) === false) {
          dd.guide.css("top", -1000);
          dd.canMove = false;
        } else {
          dd.guide.css("top", insertBefore * _grid.getOptions().rowHeight);
          dd.canMove = true;
        }

        dd.insertBefore = insertBefore;
      }
    }

    function handleDragEnd(e, dd) {
      if (!_dragging) {
        return;
      }
      _dragging = false;
      e.stopImmediatePropagation();

      dd.guide.remove();
      dd.selectionProxy.remove();

      if (dd.canMove) {
        var eventData = {
          "rows": dd.selectedRows,
          "insertBefore": dd.insertBefore
        };
        // TODO:  _grid.remapCellCssClasses ?
        _self.onMoveRows.notify(eventData);
      }

      // if keepSelectionMove is true, but there was no initial selection,
      // then the single moved element will be unselected.
      // This only happens for single selections.
      if (! options.singleStaysSelected && dd.noInitialSelection) {
        _grid.setSelectedRows([]);
      }
    }

    function handleBeforeMoveRows(e, data) {
      for (var i = 0; i < data.rows.length; i++) {
        // no point in moving before or after itself
        if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
          e.stopPropagation();
          return false;
        }
      }
      return true;
    }

    $.extend(this, {
      "onBeforeMoveRows": new Slick.Event(),
      "onMoveRows": new Slick.Event(),

      "init": init,
      "destroy": destroy
    });
  }
})(jQuery);
