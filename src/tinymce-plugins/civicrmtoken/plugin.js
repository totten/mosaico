/**
 * civicrmtoken - TinyMCE plugin which allows users to easily insert CiviCRM mail tokens.
 *
 * Tokens can be inserted multiple ways:
 *
 * 1. The developer adds 'civicrmtoken' to the toolbar.
 *     - If the user clicks the main token button, it opens a dialog.
 *     - If the user clicks the dropdown, it provides a hotlist of common tokens.
 * 2. The user presses the token hotkey, "ctrl-shift-t", and opens a dialog.
 *
 * The token dialog supports:
 *     - Multiple categories of tokens
 *     - Filtering by name
 *     - Keyboard navigation (arrows/tabs)
 *
 * == Configuration ==
 *
 *  When instantiating tinymce, the settings object should define "civicrmtoken", e.g.
 *
 *  tinymce.init({
 *    civicrmtoken: {
 *      hotlist: ['{domain.name}'],
 *      tokens: [
 *        {
 *          text: 'Domain',
 *          children: [
 *            {id: '{domain.name}', text: 'Domain Name'}
 *          ]
 *        }
 *      ]
 *    }
 *  });
 *
 * Released under MIT License.
 * Copyright (c) 2016 CiviCRM LLC
 */

/*global tinymce:true */

tinymce.PluginManager.add('civicrmtoken', function(editor, pluginUrl) {
  if (!editor.settings.civicrmtoken) {
    // Use example tokens
    editor.settings.civicrmtoken = {
      tokens: [
        {
          'text': 'Recipient',
          'children': [
            {text: 'Recipient ID', id: '{contact.contact_id}'},
            {text: 'Full Name', id: '{contact.display_name}'},
            {text: 'Greeting', id: '{contact.email_greeting}'}
          ]
        },
        {
          'text': 'Domain',
          'children': [
            {text: 'Domain Name', id: '{domain.name}'},
            {text: 'Domain Phone', id: '{domain.phone}'},
            {text: 'Domain Email', id: '{domain.email}'}
          ]
        },
        {
          'text': 'Action',
          'children': [
            {text: 'Forward this email (URL)', id: '{action.forward}'},
            {text: 'Opt out (URL)', id: '{action.optOutUrl}'}
          ]
        }
      ],
      hotlist: [
        '{contact.contact_id}',
        '{contact.display_name}'
      ]
    };
  }

  function settings() {
    return editor.settings.civicrmtoken;
  }

  /**
   * Create one menu item for each token in the hotlist.
   *
   * @param tokens
   *   Ex: tokens[0].children[0] = {id: '{contact.first_name}', text: 'First Name'}.
   * @param hotlist
   *   Ex: ['{contact.first_name}', '{contact.last_name}']
   * @returns {Array}
   *   List of menu items.
   */
  function createHotListMenu(tokens, hotlist) {
    var hotlistMenu = [];
    tinymce.each(tokens, function(category) {
      tinymce.each(category.children, function(token) {
        if (hotlist.indexOf(token.id) >= 0) {
          hotlistMenu.push({
            text: token.text,
            onclick: function() {
              editor.insertContent(token.id);
            }
          });
        }
      });
    });

    hotlistMenu.push({
      'text': '(more...)',
      onclick: function() {
        editor.execCommand('civicrmtoken');
      }
    });

    return hotlistMenu;
  }

  editor.addCommand('civicrmtoken', function(ui, v) {
    var win = null;

    function setFilter(text) {
      text = text.toLowerCase();
      win.find('button').each(function(btn){
        btn.visible(btn.data.data.searchText.indexOf(text) >= 0);
      });
      win.find('label').each(function(btn){
        btn.visible(btn.data.data.searchText.indexOf(text) >= 0);
      });
    }

    var items = [];
    tinymce.each(settings().tokens, function(category) {
      var catSearchText = '';
      tinymce.each(category.children, function(token) {
        catSearchText = catSearchText + ' ' + token.text.toLowerCase() + ' ' + token.id.toLowerCase();
      });

      items.push({
        type: 'label',
        text: category.text,
        data: {searchText: catSearchText}
      });
      tinymce.each(category.children, function(token) {
        items.push({
            type: 'button',
            text: token.text,
            data: {searchText: (token.text + " " + token.id).toLowerCase()},
            onclick: function() {
              editor.windowManager.close();
              editor.insertContent(token.id);
            }
          }
        );
      });
    });

    win = editor.windowManager.open({
      title: 'Insert Token',
      autoScroll: true, // Can we move this to the grid?
      width: 300,
      height: 300,
      body: [
        {
          type: 'textbox',
          // tinymce.util.Delay.throttle.call(this, function(){...}, 100);
          onkeyup: function(e) {
            switch (e.keyCode) {
              case 40: // Down
                win.find('button').each(function(btn) {
                  if (btn.state.data.visible) {
                    btn.focus();
                    return false;
                  }
                });
                break;
              default:
                setFilter(e.target.value);
            }
          }
        },
        {
          layout: 'grid',
          name: 'mybuttons',
          type: 'form',
          columns: 1,
          items: items
        }
      ],
      buttons: []
    });
  });

  editor.addShortcut('ctrl+shift+t', 'Insert Token', 'civicrmtoken');

  editor.addButton('civicrmtoken', {
    type: 'splitbutton',
    tooltip: 'Token (Ctrl-Shift-T)',
    text: 'Tokens',
    onclick: function() {
      editor.execCommand('civicrmtoken');
    },
    menu: createHotListMenu(settings().tokens, settings().hotlist)
  });

});
