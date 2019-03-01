
'use strict';
function MyListBox(element, itemClass, ajaxUrl) {
    this._target = element;
    this._itemClass = itemClass;
    this._ajaxUrl = ajaxUrl
    this._selectedIndex = -1;
    this.onDblClick = null;
    this.onClick = null;

    this._target.addEventListener("keydown", onKeyDown);

    var items = this._target.querySelectorAll("." + this._itemClass);
    items.forEach(function (item) {
        item.addEventListener("click", itemClicked);

        item.addEventListener("dragstart", function (e) {
            console.log("dragstart");
            e.dataTransfer.setData("text", item.innerText);
            e.stopPropagation();
        });
    });

    this.selectedIndex = function () {
        return this._selectedIndex;
    }

    this.selectedText = function () {
        let items = this._target.querySelectorAll("." + this._itemClass);
        return items[this._selectedIndex].innerText;

    }

    this.reload = function(){
        console.log("MyListBox.reload()");
    
        var that = this;
        //ajax get soundlist
        $.ajax(this._ajaxUrl, {
            method: "GET",
            complete: function (response) {
                console.log(response.responseJSON);
                let sounds = response.responseJSON;
                that._target.innerHTML="";
                sounds.forEach(function(sound){
                   let elem = "<div class=\"" + that._itemClass + "\" draggable=\"true\">";
                   elem +=  escapeHTML(sound);
                   elem += "</div>\n"
                   that._target.innerHTML += elem;
                }); 

                //re-register handlers
                var items = that._target.querySelectorAll("." + that._itemClass);
                items.forEach(function (item) {
                    item.addEventListener("click", itemClicked);
                    item.addEventListener("dragstart", function (e) {
                        console.log("dragstart");
                        e.dataTransfer.setData("text", item.innerText);
                        e.stopPropagation();
                    });
                });
    
            }
        });

    }
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    var that = this;

    function onKeyDown(e) {
        switch (e.keyCode) {
            case 38: //up
                if (e.target == that._target) {
                    e.stopPropagation();
                    e.preventDefault();

                    console.log("up");
                    let items = that._target.querySelectorAll("." + that._itemClass);
                    if (that._selectedIndex == 0) break;
                    that._selectedIndex--;

                    selectChanged();

                }
                break;
            case 40: //down
                if (e.target == that._target) {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log("down");

                    let items = that._target.querySelectorAll("." + that._itemClass);
                    if (that._selectedIndex == items.length - 1) break;
                    that._selectedIndex++;

                    selectChanged();

                }
                break;
        }
    }

    function selectChanged() {
        let items = that._target.querySelectorAll("." + that._itemClass);
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove("selected");
            if (i == that._selectedIndex) {
                items[i].classList.add("selected");
            }
        }

        let pixelPerItem = that._target.scrollHeight / items.length;
        if (pixelPerItem * that._selectedIndex < that._target.scrollTop) {
            that._target.scrollTop = pixelPerItem * that._selectedIndex;
        } else if (that._target.scrollTop + that._target.clientHeight <
            pixelPerItem * (that._selectedIndex + 1)) {
            that._target.scrollTop = pixelPerItem * (that._selectedIndex + 1) - that._target.clientHeight;
        }
    }

    var clicked = false;

    function itemClicked(e) {

        if(clicked){
            //double click
            clicked = false;

            let items = that._target.querySelectorAll("." + that._itemClass);
            let item = e.target;
            for (let i = 0; i < items.length; i++) {
                if (item == items[i]) {
                    that._selectedIndex = i;
                }
            }
            selectChanged();

            if (that.onDblClick){
                that.onDblClick(that);
            }
            return;
        }

        clicked = true;
        setTimeout(function(){
            if (clicked){
                //single click
                let items = that._target.querySelectorAll("." + that._itemClass);
                let item = e.target;
                for (let i = 0; i < items.length; i++) {
                    if (item == items[i]) {
                        that._selectedIndex = i;
                    }
                }
                selectChanged();
                clicked = false;
                if (that.onClick) that.onClick(that);
            }
        },200);
    }
}