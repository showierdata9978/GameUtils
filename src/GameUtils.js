// vm: Scratch VM (https://raw.githubusercontent.com/LLK/scratch-vm/develop/src/index.js)
/*global vm */
/*eslint no-undef: "error"*/

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

    this.audio_player = new Audio();
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
          text: "create sprite from [url]",
          arguments: {
            url: {
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

        //sound stuff
        {
          opcode: "playAudioFromURL",
          blockType: "command",
          text: "Play audio [URL]",
          arguments: {
            URL: {
              type: "string",
              defaultValue: "https://scratch.mit.edu/sounds/music/8bit.mp3",
            },
          },
        },
        {
          opcode: "stopAudio",
          blockType: "command",
          text: "Stop audio",
          arguments: {},
        },
        {
          opcode:"sounds_done",
          blockType:"reporter",
          text: "Is Sound From URL Done?"
        }
      ],
    };
  }

  async fetch_asset(url) {
    const response = await fetch(url);
    if (response.status == 200) {
      const blob = await response.blob();
      return blob;
    } else {
      return null;
    }
  }

  async create_sprite(args) {
    try {
      const sprite_zip = await fetch(args.url);
      if (sprite_zip.status == 200) {
        const sprite_zip_buffer = await sprite_zip.blob();
        var sprite = await vm.AddSprite(sprite_zip_buffer);
        this._sprites.push(sprite.id);
      } else {
        console.log(
          "Failed to fetch sprite:  Status: " + sprite_zip.status,
          +" " + sprite_zip.statusText
        );
      }
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
      this.deleted_sprites[args.sprite.id]();
      delete this.deleted_sprites[args.sprite.id];
      this._sprites.push(args.sprite.id);
    } catch (e) {
      console.error(e);
    }
  }
  // costumes
  async create_costume(args, util) {
    try {
      // get current sprite
      if (util.target.isSprite) {
        var sprite = util.target.sprite;
        const req = await fetch(args.uri);
        if (req.status == 200) {
          const blob = await req.blob();
          const costume = await vm.addCostume(blob, sprite.id);
          this._costumes.push(costume.id);
        } else {
          console.error("Failed to fetch costume");
        }
      } else {
        console.error("Internal Error: Target is not a sprite");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async delete_costume(args, util) {
    try {
      // get current sprite
      if (util.target.isSprite) {
        var sprite = util.target.sprite;
        this.deleted_costumes[args.costume] = await vm.deleteCostume(
          sprite.costumes[args.costume].id
        );
        this._costumes.splice(this._costumes.indexOf(args.costume), 1);
      } else {
        console.error("Internal Error: Target is not a sprite");
      }
    } catch (e) {
      console.error(e);
    }
  }
  playAudioFromURL({ URL }) {
    this.audio_player.pause();
    this.audio_player.currentTime = 0;
    this.audio_player.src = URL;
    this.audio_player.play();
    this.audio_player.loop = false;
  }

  stopAudio({}) {
    this.audio_player.pause();
    this.audio_player.currentTime = 0;
    this.audio_player.src = null;
  }
  sounds_done() {
    return this.audio_player.ended;
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
