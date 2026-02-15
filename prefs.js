import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class OnTheTopPreferences extends ExtensionPreferences {
//export default class OnTheTopPreferences{
    fillPreferencesWindow(window) {
        window.set_default_size(500-122, 600-122);
        let settings = this.getSettings();
        const snapshot = this._loadSettingsSnapshot(settings);

        let builder = new Gtk.Builder();
        builder.set_translation_domain(this.metadata['gettext-domain']);
        builder.add_from_file(this.dir.get_child('settings.ui').get_path());

        let comboRowPositions = builder.get_object('positions'); 
        let comboRowRanks = builder.get_object('ranking');
        let comboRowSticky = builder.get_object('stickiness');
        let shortcutButton = builder.get_object('shortcut-button');

        //set the default value
        if(snapshot.position == 'right'){
            comboRowPositions.set_selected(1);
        }else{
            comboRowPositions.set_selected(0);  
        }

        comboRowRanks.set_selected(snapshot.rank);

        if(snapshot.stickiness == "false"){
            comboRowSticky.set_selected(1);
        }else{
            comboRowSticky.set_selected(0);
        }

        // Set up shortcut button
        this._updateShortcutButtonLabel(shortcutButton, settings);

        //add listeners
        comboRowPositions.connect("notify::selected-item",()=>{
            this._comboRowPositionsChange(comboRowPositions, settings)
        })

        comboRowRanks.connect("notify::selected-item",()=>{
            this._comboRowRanksChange(comboRowRanks, settings)
        })

        comboRowSticky.connect("notify::selected-item",()=>{
            this._comboRowStickinessChange(comboRowSticky, settings)
        })

        shortcutButton.connect('clicked', () => {
            this._onShortcutButtonClicked(shortcutButton, settings);
        });

        window.add(builder.get_object('settings_page'));
    }

    _loadSettingsSnapshot(settings) {
        const position = settings.get_string('positions') || 'right';
        const rankValue = parseInt(settings.get_string('ranking'), 10);
        const rank = Number.isNaN(rankValue) ? 0 : rankValue;
        const stickiness = settings.get_string('stickiness') || 'false';
        return { position, rank, stickiness };
    }

    _comboRowPositionsChange(comboRow, settings){
        console.log('_comboRowPositionsChange',comboRow.selected)
        try{
            switch(comboRow.get_selected()){
                case 0:
                    settings.set_string("positions","left");
                    break;
                case 1:
                    settings.set_string("positions","right");
                    break;
                default:
                    console.log("nem mentek!!")
                    break;
            }
        }catch(error){
            console.log('error',error);
        }
        
    }

    _comboRowRanksChange(comboRow, settings){
        settings.set_string("ranking",comboRow.selected.toString());
    }

    _comboRowStickinessChange(comboRow, settings){
        try{
            switch(comboRow.get_selected()){
                case 0:
                    settings.set_string("stickiness","true");
                    break;
                case 1:
                    settings.set_string("stickiness","false");
                    break;
                default:
                    console.log("nem mentek!!")
                    break;
            }
        }catch(error){
            console.log('error',error);
        }
    }

    _updateShortcutButtonLabel(button, settings) {
        const shortcut = settings.get_strv('toggle-pin-shortcut');
        if (shortcut.length > 0) {
            button.set_label(shortcut[0]);
        } else {
            button.set_label('None');
        }
    }

    _onShortcutButtonClicked(button, settings) {
        const dialog = new Gtk.Dialog({
            title: 'Set Keyboard Shortcut',
            transient_for: button.get_root(),
            modal: true,
            use_header_bar: 1
        });

        dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
        dialog.add_button('Clear', Gtk.ResponseType.REJECT);
        dialog.add_button('Set', Gtk.ResponseType.OK);

        const content = dialog.get_content_area();
        const label = new Gtk.Label({
            label: 'Press the key combination you want to use as a shortcut\n\nCurrent: ' + (settings.get_strv('toggle-pin-shortcut')[0] || 'None'),
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12
        });
        content.append(label);

        let keyval = 0;
        let modifiers = 0;

        const eventController = new Gtk.EventControllerKey();
        dialog.add_controller(eventController);

        eventController.connect('key-pressed', (controller, keyval_pressed, keycode, state) => {
            keyval = keyval_pressed;
            modifiers = state;
            
            const shortcutString = Gtk.accelerator_name(keyval, modifiers);
            label.set_label('Press the key combination you want to use as a shortcut\n\nNew: ' + shortcutString);
            
            return true;
        });

        dialog.connect('response', (dialog, response) => {
            if (response === Gtk.ResponseType.OK && keyval !== 0) {
                const shortcutString = Gtk.accelerator_name(keyval, modifiers);
                settings.set_strv('toggle-pin-shortcut', [shortcutString]);
                this._updateShortcutButtonLabel(button, settings);
            } else if (response === Gtk.ResponseType.REJECT) {
                settings.set_strv('toggle-pin-shortcut', []);
                this._updateShortcutButtonLabel(button, settings);
            }
            
            dialog.destroy();
        });

        dialog.present();
    }
}