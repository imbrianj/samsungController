/*jslint white: true */
/*global module, require, console */

/**
 * Copyright (c) 2014 brian@bevey.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

module.exports = (function () {
  'use strict';

  /**
   * @author brian@bevey.org
   * @fileoverview Register comments to Gerty.
   */
  return {
    version : 20151105,

    inputs  : ['command', 'text'],

    /**
     * Whitelist of available emotion key codes to use.
     */
    keymap  : ['ANGRY', 'EXCITED', 'HAPPY', 'INDIFFERENT', 'LOVE', 'PLAYFUL', 'SAD', 'SCARED', 'SLEEP', 'STRESSED'],

    /**
     * Reference template fragments to be used by the parser.
     */
    fragments : function () {
      var fs = require('fs');

      return { comment : fs.readFileSync(__dirname + '/fragments/comment.tpl').toString() };
    },

    /**
     * Randomly select an emoji that fits the mood.
     */
    getEmojiType : function (command) {
      var emojis;

      switch(command) {
        case 'ANGRY'       :
          emojis = ['😡', '😠', '😫', '😣'];
        break;

        case 'EXCITED'     :
          emojis = ['😋', '😂', '😁']; // ' Comments to fix Atoms syntax highlighter on Linux
        break;

        case 'HAPPY'       :
          emojis = ['😄', '😃', '😀', '😊', '😉', '😎', '😋', '😁', '😛', '😝', '😜']; // '''
        break;

        case 'INDIFFERENT' :
          emojis = ['😑', '😶', '😐', '😒', '😌']; // '
        break;

        case 'LOVE'        :
          emojis = ['😍', '😘', '😚', '😗', '😙', '😏', '😇']; // ''
        break;

        case 'PLAYFUL'     :
          emojis = ['😜', '😝', '😏', '😇', '😈', '😎', '😋', '😛']; // '
        break;

        case 'SAD'         :
          emojis = ['😕', '😧', '😟', '😖', '😥', '😪', '😭', '😢', '😞', '😔'];
        break;

        case 'SCARED'      :
          emojis = ['😕', '😮', '😧', '😦', '😟', '😲', '😵', '😱']; // '
        break;

        case 'SLEEP'       :
          emojis = ['😴'];
        break;

        case 'STRESSED'    :
          emojis = ['😕', '😧', '😦', '😟', '😲', '😵', '😖', '😱', '😨', '😫', '😩', '😓', '😥'];
        break;

        default            :
          emojis = [command];
        break;
      }

      return emojis[Math.floor(Math.random() * emojis.length)];
    },

    /**
     * Random and rare classes should be applied that will have Gerty have
     * simple animations.
     */
    getActionType : function (personality, command) {
      var random  = Math.random() * 1000,
          actions = ['bounce', 'roll', 'shrink', 'shake'],
          action  = '';

      // If you're asleep, you shouldn't be very active.
      if(command !== 'SLEEP') {
        // At a rare random event, Gerty should have some added personality.
        if((personality > random) && (random % 2)) {
          action = actions[Math.floor(Math.random() * actions.length)];
        }
      }

      return action;
    },

    /**
     * Gerty should accept comments from users and from device interactions and
     * collate them for display as a running chat-log.
     */
    getComments : function (config) {
      var deviceState = require(__dirname + '/../../lib/deviceState'),
          gertyState  = deviceState.getDeviceState(config.deviceId),
          comment     = config.text,
          allComments = [],
          now;

      if(gertyState && gertyState.value && gertyState.value.comments) {
        allComments = JSON.parse(JSON.stringify(gertyState.value.comments));
      }

      if(comment) {
        now = new Date().getTime();

        if(allComments.length) {
          allComments.push({ text : comment, time : now });
        }

        else {
          allComments = [{ text : comment, time : now }];
        }
      }

      // We don't need to keep a full log as it'd be too heavy to update with
      // long uptimes.
      return allComments.slice(0, 100);
    },

    /**
     * Speech dictation can be a bit rough, so we'll try to do some simple text
     * replacement to convert "bedroom lambs" to "bedroom lamps", etc.
     */
    getCorrectedText : function (text, config) {
      var correctionHash = config.corrections || {},
          term           = '';

      if(text) {
        for(term in correctionHash) {
          text = text.split(term).join(correctionHash[term]);
        }
      }

      return text;
    },

    /**
     * Gerty should default to being happy and active.
     */
    init : function (controller, config) {
      var runCommand = require(__dirname + '/../../lib/runCommand');

      runCommand.runCommand(controller.config.deviceId, 'HAPPY', controller.config.deviceId);
    },

    state : function (controller, config, callback) {
      var runCommand  = require(__dirname + '/../../lib/runCommand'),
          deviceState = require(__dirname + '/../../lib/deviceState'),
          gertyState  = deviceState.getDeviceState(controller.config.deviceId),
          personality = (controller.config.personality / 100) || 0.5,
          random      = Math.random(),
          gerty       = {};

      if((gertyState) && (gertyState.value) && (personality > random)) {
        // At a rare random event, Gerty should have some added personality.
        if((random > 0.95) && (gertyState.value.description !== 'SLEEPING')) {
          gertyState.value.description = 'PLAYFUL';
        }

        runCommand.runCommand(controller.config.deviceId, gertyState.value.description, controller.config.deviceId);
      }
    },

    send : function (config) {
      var deviceState = require(__dirname + '/../../lib/deviceState'),
          gertyState  = deviceState.getDeviceState(config.device.deviceId) || {},
          gerty       = {},
          value,
          action,
          comments;

      gertyState.value  = gertyState.value                                  || {};
      gerty.deviceId    = config.device.deviceId;
      gerty.command     = config.command                                    || '';
      gerty.text        = this.getCorrectedText(config.text, config.device) || '';
      gerty.personality = config.device.personality                         || 0.5;
      gerty.comments    = config.comments                                   || [];
      gerty.callback    = config.callback                                   || function () {};

      value    = this.getEmojiType(gerty.command)                           || gertyState.value.emoji;
      action   = this.getActionType(gerty.personality, gerty.command);
      comments = this.getComments(gerty)                                    || gertyState.value.comments;

      gerty.callback(null, { emoji : value, description : gerty.command, action : action, comments : comments });
    }
  };
}());