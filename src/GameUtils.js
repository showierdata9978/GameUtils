// vm: Scratch VM (https://raw.githubusercontent.com/LLK/scratch-vm/develop/src/index.js)
/*global vm */
/*eslint no-undef: "error"*/

const JSZip = require('jszip');


class GameUtils {
  constructor(runtime, id) {
    //ext stuff
    this.runtime = runtime;
    this.menuIconURI = null;
    this.blockIconURI = null;
    this.colorScheme = ["#41e2d0", "#0DA57A"];

    //ext data
    this.deleted_sprites = {};
    this._sprites = [];
    this._costumes = [];
  }

  getInfo() {
    return {
      id: "gameutils",
      name: "GameUtils",
      blockIconURI: this.blockIconURI,
      menuIconURI: this.menuIconURI,
      color1: this.colorScheme[0],
      color2: this.colorScheme[1],
      blocks: [
        //sprite stuff
        {
          opcode: "create_sprite",
          blockType: "command",
          text: "create sprite from [json] and sprite assets uri [uri]",
          arguments: {
            json: {
              type: "string",
              defaultValue: "{}",
            },
            uri: {
              type: "string",
              defaultValue: "",
            },
          },
        },
        {
          opcode: "delete_sprite",
          blockType: "command",
          text: "delete sprite [sprite]",
          arguments: {
            sprite: {
              type: "string",
              defaultValue: "sprite1",
            },
          },
        },
        {
          opcode: "restore_sprite",
          blockType: "command",
          text: "restore sprite [sprite]",

          arguments: {
            sprite: {
              type: "string",
              defaultValue: "sprite1",
            },
          },
        },
        // costume stuff
        {
          opcode: "create_costume",
          blockType: "command",
          text: "create costume [costume] from [uri]",
          arguments: {
            costume: {
              type: "string",
              defaultValue: "costume1",
            },
            uri: {
              type: "string",
              defaultValue:
                "https://en.scratch-wiki.info/w/images/ScratchCat3.0.svg",
            },
          },
        },
        {
          opcode: "delete_costume",
          blockType: "command",
          text: "delete costume [costume]",
          arguments: {
            costume: {
              type: "string",
              defaultValue: "costume1",
            },
          },
        },

        {},
      ],
    };
  }
  async create_sprite(args) {
    try {
      var json = JSON.parse(args.json);
      var name = json.name;
      var costumes = json['costumes'];
     
    
      json['costumes'] = [];
    
      var GottenCostumes = []
      const zip = new JSZip();
      zip.file('sprite.json', json);
      var req;
      for (var costume in costumes) {
        req = await fetch(costume)
        if (req.status == 200) {
          GottenCostumes.push(await req.blob())
        }

      }
      var GottenSounds = [];
      for (var sound in json['sounds']) {
        req = await fetch(sound)
        if (req.status == 200) {
          GottenSounds.push(await req.blob())
        }
      }

      vm._addFileDescsToZip(GottenCostumes.concat(GottenSounds), zip)

      await vm.AddSprite(zip.generateAsync({
        type: 'blob',
        mimeType: 'application/x.scratch.sb3',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 6 // Tradeoff between best speed (1) and best compression (9)
        }
      }))
      this._sprites.push(name);
    } catch (e) {
      console.error(e);
    }
  }
  async delete_sprite(args, util) {
    try {
      var sprite = util.target;
      this.deleted_sprites[args.sprite.id] = await vm.deleteSprite(sprite.id);
      this._sprites.splice(this._sprites.indexOf(args.sprite), 1);
    } catch (e) {
      console.error(e);
    }
  }
  async restore_sprite(args) {
    try {
      this.deleted_sprites[args.sprite]();
      delete this.deleted_sprites[args.sprite];
      this._sprites.push(args.sprite);
    } catch (e) {
      console.error(e);
    }
  }
  // costumes
  async create_costume(args, util) {
    try {
      // get current sprite
      var costume = util.sprite;
      var bitmap = await (await fetch(args.uri)).blob();
      costume.setCostume(costume.getCostumeIndexByName(args.costume), bitmap);
    } catch (e) {
      console.error(e);
    }
  }
}

// Register the extension as unsandboxed

(function () {
  var extensionClass = GameUtils;
  if (typeof window === "undefined" || !window.vm) {
    console.error("GameUtils is not supported in this environment.");
  } else {
    var extensionInstance = new extensionClass(
      window.vm.extensionManager.runtime
    );
    var serviceName =
      window.vm.extensionManager._registerInternalExtension(extensionInstance);
    window.vm.extensionManager._loadedExtensions.set(
      extensionInstance.getInfo().id,
      serviceName
    );
    console.log("GameUtils has loaded.");
  }
})();
