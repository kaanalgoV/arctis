/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const alg = $root.alg = (() => {

    /**
     * Namespace alg.
     * @exports alg
     * @namespace
     */
    const alg = {};

    alg.live = (function() {

        /**
         * Namespace live.
         * @memberof alg
         * @namespace
         */
        const live = {};

        live.AccountUpdate = (function() {

            /**
             * Properties of an AccountUpdate.
             * @memberof alg.live
             * @interface IAccountUpdate
             * @property {number|Long|null} [balance] AccountUpdate balance
             * @property {number|Long|null} [marginUsed] AccountUpdate marginUsed
             * @property {number|Long|null} [marginAvailable] AccountUpdate marginAvailable
             * @property {number|Long|null} [openPnl] AccountUpdate openPnl
             * @property {number|Long|null} [realizedPnl] AccountUpdate realizedPnl
             * @property {number|Long|null} [commission] AccountUpdate commission
             * @property {string|null} [accountId] AccountUpdate accountId
             * @property {string|null} [fcmId] AccountUpdate fcmId
             */

            /**
             * Constructs a new AccountUpdate.
             * @memberof alg.live
             * @classdesc Represents an AccountUpdate.
             * @implements IAccountUpdate
             * @constructor
             * @param {alg.live.IAccountUpdate=} [properties] Properties to set
             */
            function AccountUpdate(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * AccountUpdate balance.
             * @member {number|Long} balance
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.balance = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AccountUpdate marginUsed.
             * @member {number|Long} marginUsed
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.marginUsed = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AccountUpdate marginAvailable.
             * @member {number|Long} marginAvailable
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.marginAvailable = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AccountUpdate openPnl.
             * @member {number|Long} openPnl
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.openPnl = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AccountUpdate realizedPnl.
             * @member {number|Long} realizedPnl
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.realizedPnl = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AccountUpdate commission.
             * @member {number|Long} commission
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.commission = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AccountUpdate accountId.
             * @member {string} accountId
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.accountId = "";

            /**
             * AccountUpdate fcmId.
             * @member {string} fcmId
             * @memberof alg.live.AccountUpdate
             * @instance
             */
            AccountUpdate.prototype.fcmId = "";

            /**
             * Creates a new AccountUpdate instance using the specified properties.
             * @function create
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {alg.live.IAccountUpdate=} [properties] Properties to set
             * @returns {alg.live.AccountUpdate} AccountUpdate instance
             */
            AccountUpdate.create = function create(properties) {
                return new AccountUpdate(properties);
            };

            /**
             * Encodes the specified AccountUpdate message. Does not implicitly {@link alg.live.AccountUpdate.verify|verify} messages.
             * @function encode
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {alg.live.IAccountUpdate} message AccountUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AccountUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.balance != null && Object.hasOwnProperty.call(message, "balance"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.balance);
                if (message.marginUsed != null && Object.hasOwnProperty.call(message, "marginUsed"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int64(message.marginUsed);
                if (message.marginAvailable != null && Object.hasOwnProperty.call(message, "marginAvailable"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int64(message.marginAvailable);
                if (message.openPnl != null && Object.hasOwnProperty.call(message, "openPnl"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.openPnl);
                if (message.realizedPnl != null && Object.hasOwnProperty.call(message, "realizedPnl"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.realizedPnl);
                if (message.commission != null && Object.hasOwnProperty.call(message, "commission"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int64(message.commission);
                if (message.accountId != null && Object.hasOwnProperty.call(message, "accountId"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.accountId);
                if (message.fcmId != null && Object.hasOwnProperty.call(message, "fcmId"))
                    writer.uint32(/* id 8, wireType 2 =*/66).string(message.fcmId);
                return writer;
            };

            /**
             * Encodes the specified AccountUpdate message, length delimited. Does not implicitly {@link alg.live.AccountUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {alg.live.IAccountUpdate} message AccountUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AccountUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an AccountUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.AccountUpdate} AccountUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AccountUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.AccountUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.balance = reader.int64();
                            break;
                        }
                    case 2: {
                            message.marginUsed = reader.int64();
                            break;
                        }
                    case 3: {
                            message.marginAvailable = reader.int64();
                            break;
                        }
                    case 4: {
                            message.openPnl = reader.int64();
                            break;
                        }
                    case 5: {
                            message.realizedPnl = reader.int64();
                            break;
                        }
                    case 6: {
                            message.commission = reader.int64();
                            break;
                        }
                    case 7: {
                            message.accountId = reader.string();
                            break;
                        }
                    case 8: {
                            message.fcmId = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an AccountUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.AccountUpdate} AccountUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AccountUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an AccountUpdate message.
             * @function verify
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            AccountUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.balance != null && message.hasOwnProperty("balance"))
                    if (!$util.isInteger(message.balance) && !(message.balance && $util.isInteger(message.balance.low) && $util.isInteger(message.balance.high)))
                        return "balance: integer|Long expected";
                if (message.marginUsed != null && message.hasOwnProperty("marginUsed"))
                    if (!$util.isInteger(message.marginUsed) && !(message.marginUsed && $util.isInteger(message.marginUsed.low) && $util.isInteger(message.marginUsed.high)))
                        return "marginUsed: integer|Long expected";
                if (message.marginAvailable != null && message.hasOwnProperty("marginAvailable"))
                    if (!$util.isInteger(message.marginAvailable) && !(message.marginAvailable && $util.isInteger(message.marginAvailable.low) && $util.isInteger(message.marginAvailable.high)))
                        return "marginAvailable: integer|Long expected";
                if (message.openPnl != null && message.hasOwnProperty("openPnl"))
                    if (!$util.isInteger(message.openPnl) && !(message.openPnl && $util.isInteger(message.openPnl.low) && $util.isInteger(message.openPnl.high)))
                        return "openPnl: integer|Long expected";
                if (message.realizedPnl != null && message.hasOwnProperty("realizedPnl"))
                    if (!$util.isInteger(message.realizedPnl) && !(message.realizedPnl && $util.isInteger(message.realizedPnl.low) && $util.isInteger(message.realizedPnl.high)))
                        return "realizedPnl: integer|Long expected";
                if (message.commission != null && message.hasOwnProperty("commission"))
                    if (!$util.isInteger(message.commission) && !(message.commission && $util.isInteger(message.commission.low) && $util.isInteger(message.commission.high)))
                        return "commission: integer|Long expected";
                if (message.accountId != null && message.hasOwnProperty("accountId"))
                    if (!$util.isString(message.accountId))
                        return "accountId: string expected";
                if (message.fcmId != null && message.hasOwnProperty("fcmId"))
                    if (!$util.isString(message.fcmId))
                        return "fcmId: string expected";
                return null;
            };

            /**
             * Creates an AccountUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.AccountUpdate} AccountUpdate
             */
            AccountUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.AccountUpdate)
                    return object;
                let message = new $root.alg.live.AccountUpdate();
                if (object.balance != null)
                    if ($util.Long)
                        (message.balance = $util.Long.fromValue(object.balance)).unsigned = false;
                    else if (typeof object.balance === "string")
                        message.balance = parseInt(object.balance, 10);
                    else if (typeof object.balance === "number")
                        message.balance = object.balance;
                    else if (typeof object.balance === "object")
                        message.balance = new $util.LongBits(object.balance.low >>> 0, object.balance.high >>> 0).toNumber();
                if (object.marginUsed != null)
                    if ($util.Long)
                        (message.marginUsed = $util.Long.fromValue(object.marginUsed)).unsigned = false;
                    else if (typeof object.marginUsed === "string")
                        message.marginUsed = parseInt(object.marginUsed, 10);
                    else if (typeof object.marginUsed === "number")
                        message.marginUsed = object.marginUsed;
                    else if (typeof object.marginUsed === "object")
                        message.marginUsed = new $util.LongBits(object.marginUsed.low >>> 0, object.marginUsed.high >>> 0).toNumber();
                if (object.marginAvailable != null)
                    if ($util.Long)
                        (message.marginAvailable = $util.Long.fromValue(object.marginAvailable)).unsigned = false;
                    else if (typeof object.marginAvailable === "string")
                        message.marginAvailable = parseInt(object.marginAvailable, 10);
                    else if (typeof object.marginAvailable === "number")
                        message.marginAvailable = object.marginAvailable;
                    else if (typeof object.marginAvailable === "object")
                        message.marginAvailable = new $util.LongBits(object.marginAvailable.low >>> 0, object.marginAvailable.high >>> 0).toNumber();
                if (object.openPnl != null)
                    if ($util.Long)
                        (message.openPnl = $util.Long.fromValue(object.openPnl)).unsigned = false;
                    else if (typeof object.openPnl === "string")
                        message.openPnl = parseInt(object.openPnl, 10);
                    else if (typeof object.openPnl === "number")
                        message.openPnl = object.openPnl;
                    else if (typeof object.openPnl === "object")
                        message.openPnl = new $util.LongBits(object.openPnl.low >>> 0, object.openPnl.high >>> 0).toNumber();
                if (object.realizedPnl != null)
                    if ($util.Long)
                        (message.realizedPnl = $util.Long.fromValue(object.realizedPnl)).unsigned = false;
                    else if (typeof object.realizedPnl === "string")
                        message.realizedPnl = parseInt(object.realizedPnl, 10);
                    else if (typeof object.realizedPnl === "number")
                        message.realizedPnl = object.realizedPnl;
                    else if (typeof object.realizedPnl === "object")
                        message.realizedPnl = new $util.LongBits(object.realizedPnl.low >>> 0, object.realizedPnl.high >>> 0).toNumber();
                if (object.commission != null)
                    if ($util.Long)
                        (message.commission = $util.Long.fromValue(object.commission)).unsigned = false;
                    else if (typeof object.commission === "string")
                        message.commission = parseInt(object.commission, 10);
                    else if (typeof object.commission === "number")
                        message.commission = object.commission;
                    else if (typeof object.commission === "object")
                        message.commission = new $util.LongBits(object.commission.low >>> 0, object.commission.high >>> 0).toNumber();
                if (object.accountId != null)
                    message.accountId = String(object.accountId);
                if (object.fcmId != null)
                    message.fcmId = String(object.fcmId);
                return message;
            };

            /**
             * Creates a plain object from an AccountUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {alg.live.AccountUpdate} message AccountUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AccountUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.balance = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.balance = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.marginUsed = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.marginUsed = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.marginAvailable = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.marginAvailable = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.openPnl = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.openPnl = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.realizedPnl = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.realizedPnl = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.commission = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.commission = options.longs === String ? "0" : 0;
                    object.accountId = "";
                    object.fcmId = "";
                }
                if (message.balance != null && message.hasOwnProperty("balance"))
                    if (typeof message.balance === "number")
                        object.balance = options.longs === String ? String(message.balance) : message.balance;
                    else
                        object.balance = options.longs === String ? $util.Long.prototype.toString.call(message.balance) : options.longs === Number ? new $util.LongBits(message.balance.low >>> 0, message.balance.high >>> 0).toNumber() : message.balance;
                if (message.marginUsed != null && message.hasOwnProperty("marginUsed"))
                    if (typeof message.marginUsed === "number")
                        object.marginUsed = options.longs === String ? String(message.marginUsed) : message.marginUsed;
                    else
                        object.marginUsed = options.longs === String ? $util.Long.prototype.toString.call(message.marginUsed) : options.longs === Number ? new $util.LongBits(message.marginUsed.low >>> 0, message.marginUsed.high >>> 0).toNumber() : message.marginUsed;
                if (message.marginAvailable != null && message.hasOwnProperty("marginAvailable"))
                    if (typeof message.marginAvailable === "number")
                        object.marginAvailable = options.longs === String ? String(message.marginAvailable) : message.marginAvailable;
                    else
                        object.marginAvailable = options.longs === String ? $util.Long.prototype.toString.call(message.marginAvailable) : options.longs === Number ? new $util.LongBits(message.marginAvailable.low >>> 0, message.marginAvailable.high >>> 0).toNumber() : message.marginAvailable;
                if (message.openPnl != null && message.hasOwnProperty("openPnl"))
                    if (typeof message.openPnl === "number")
                        object.openPnl = options.longs === String ? String(message.openPnl) : message.openPnl;
                    else
                        object.openPnl = options.longs === String ? $util.Long.prototype.toString.call(message.openPnl) : options.longs === Number ? new $util.LongBits(message.openPnl.low >>> 0, message.openPnl.high >>> 0).toNumber() : message.openPnl;
                if (message.realizedPnl != null && message.hasOwnProperty("realizedPnl"))
                    if (typeof message.realizedPnl === "number")
                        object.realizedPnl = options.longs === String ? String(message.realizedPnl) : message.realizedPnl;
                    else
                        object.realizedPnl = options.longs === String ? $util.Long.prototype.toString.call(message.realizedPnl) : options.longs === Number ? new $util.LongBits(message.realizedPnl.low >>> 0, message.realizedPnl.high >>> 0).toNumber() : message.realizedPnl;
                if (message.commission != null && message.hasOwnProperty("commission"))
                    if (typeof message.commission === "number")
                        object.commission = options.longs === String ? String(message.commission) : message.commission;
                    else
                        object.commission = options.longs === String ? $util.Long.prototype.toString.call(message.commission) : options.longs === Number ? new $util.LongBits(message.commission.low >>> 0, message.commission.high >>> 0).toNumber() : message.commission;
                if (message.accountId != null && message.hasOwnProperty("accountId"))
                    object.accountId = message.accountId;
                if (message.fcmId != null && message.hasOwnProperty("fcmId"))
                    object.fcmId = message.fcmId;
                return object;
            };

            /**
             * Converts this AccountUpdate to JSON.
             * @function toJSON
             * @memberof alg.live.AccountUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AccountUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AccountUpdate
             * @function getTypeUrl
             * @memberof alg.live.AccountUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AccountUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.AccountUpdate";
            };

            return AccountUpdate;
        })();

        live.PositionUpdate = (function() {

            /**
             * Properties of a PositionUpdate.
             * @memberof alg.live
             * @interface IPositionUpdate
             * @property {string|null} [symbol] PositionUpdate symbol
             * @property {alg.live.Side|null} [side] PositionUpdate side
             * @property {number|null} [qty] PositionUpdate qty
             * @property {number|Long|null} [avgEntry] PositionUpdate avgEntry
             * @property {number|Long|null} [unrealizedPnl] PositionUpdate unrealizedPnl
             */

            /**
             * Constructs a new PositionUpdate.
             * @memberof alg.live
             * @classdesc Represents a PositionUpdate.
             * @implements IPositionUpdate
             * @constructor
             * @param {alg.live.IPositionUpdate=} [properties] Properties to set
             */
            function PositionUpdate(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PositionUpdate symbol.
             * @member {string} symbol
             * @memberof alg.live.PositionUpdate
             * @instance
             */
            PositionUpdate.prototype.symbol = "";

            /**
             * PositionUpdate side.
             * @member {alg.live.Side} side
             * @memberof alg.live.PositionUpdate
             * @instance
             */
            PositionUpdate.prototype.side = 0;

            /**
             * PositionUpdate qty.
             * @member {number} qty
             * @memberof alg.live.PositionUpdate
             * @instance
             */
            PositionUpdate.prototype.qty = 0;

            /**
             * PositionUpdate avgEntry.
             * @member {number|Long} avgEntry
             * @memberof alg.live.PositionUpdate
             * @instance
             */
            PositionUpdate.prototype.avgEntry = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * PositionUpdate unrealizedPnl.
             * @member {number|Long} unrealizedPnl
             * @memberof alg.live.PositionUpdate
             * @instance
             */
            PositionUpdate.prototype.unrealizedPnl = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new PositionUpdate instance using the specified properties.
             * @function create
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {alg.live.IPositionUpdate=} [properties] Properties to set
             * @returns {alg.live.PositionUpdate} PositionUpdate instance
             */
            PositionUpdate.create = function create(properties) {
                return new PositionUpdate(properties);
            };

            /**
             * Encodes the specified PositionUpdate message. Does not implicitly {@link alg.live.PositionUpdate.verify|verify} messages.
             * @function encode
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {alg.live.IPositionUpdate} message PositionUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PositionUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.side != null && Object.hasOwnProperty.call(message, "side"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.side);
                if (message.qty != null && Object.hasOwnProperty.call(message, "qty"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.qty);
                if (message.avgEntry != null && Object.hasOwnProperty.call(message, "avgEntry"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.avgEntry);
                if (message.unrealizedPnl != null && Object.hasOwnProperty.call(message, "unrealizedPnl"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.unrealizedPnl);
                return writer;
            };

            /**
             * Encodes the specified PositionUpdate message, length delimited. Does not implicitly {@link alg.live.PositionUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {alg.live.IPositionUpdate} message PositionUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PositionUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PositionUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.PositionUpdate} PositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PositionUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.PositionUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.side = reader.int32();
                            break;
                        }
                    case 3: {
                            message.qty = reader.int32();
                            break;
                        }
                    case 4: {
                            message.avgEntry = reader.int64();
                            break;
                        }
                    case 5: {
                            message.unrealizedPnl = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PositionUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.PositionUpdate} PositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PositionUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PositionUpdate message.
             * @function verify
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PositionUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.side != null && message.hasOwnProperty("side"))
                    switch (message.side) {
                    default:
                        return "side: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.qty != null && message.hasOwnProperty("qty"))
                    if (!$util.isInteger(message.qty))
                        return "qty: integer expected";
                if (message.avgEntry != null && message.hasOwnProperty("avgEntry"))
                    if (!$util.isInteger(message.avgEntry) && !(message.avgEntry && $util.isInteger(message.avgEntry.low) && $util.isInteger(message.avgEntry.high)))
                        return "avgEntry: integer|Long expected";
                if (message.unrealizedPnl != null && message.hasOwnProperty("unrealizedPnl"))
                    if (!$util.isInteger(message.unrealizedPnl) && !(message.unrealizedPnl && $util.isInteger(message.unrealizedPnl.low) && $util.isInteger(message.unrealizedPnl.high)))
                        return "unrealizedPnl: integer|Long expected";
                return null;
            };

            /**
             * Creates a PositionUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.PositionUpdate} PositionUpdate
             */
            PositionUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.PositionUpdate)
                    return object;
                let message = new $root.alg.live.PositionUpdate();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.side) {
                default:
                    if (typeof object.side === "number") {
                        message.side = object.side;
                        break;
                    }
                    break;
                case "SIDE_UNKNOWN":
                case 0:
                    message.side = 0;
                    break;
                case "BUY":
                case 1:
                    message.side = 1;
                    break;
                case "SELL":
                case 2:
                    message.side = 2;
                    break;
                }
                if (object.qty != null)
                    message.qty = object.qty | 0;
                if (object.avgEntry != null)
                    if ($util.Long)
                        (message.avgEntry = $util.Long.fromValue(object.avgEntry)).unsigned = false;
                    else if (typeof object.avgEntry === "string")
                        message.avgEntry = parseInt(object.avgEntry, 10);
                    else if (typeof object.avgEntry === "number")
                        message.avgEntry = object.avgEntry;
                    else if (typeof object.avgEntry === "object")
                        message.avgEntry = new $util.LongBits(object.avgEntry.low >>> 0, object.avgEntry.high >>> 0).toNumber();
                if (object.unrealizedPnl != null)
                    if ($util.Long)
                        (message.unrealizedPnl = $util.Long.fromValue(object.unrealizedPnl)).unsigned = false;
                    else if (typeof object.unrealizedPnl === "string")
                        message.unrealizedPnl = parseInt(object.unrealizedPnl, 10);
                    else if (typeof object.unrealizedPnl === "number")
                        message.unrealizedPnl = object.unrealizedPnl;
                    else if (typeof object.unrealizedPnl === "object")
                        message.unrealizedPnl = new $util.LongBits(object.unrealizedPnl.low >>> 0, object.unrealizedPnl.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a PositionUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {alg.live.PositionUpdate} message PositionUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PositionUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    object.side = options.enums === String ? "SIDE_UNKNOWN" : 0;
                    object.qty = 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.avgEntry = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.avgEntry = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.unrealizedPnl = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.unrealizedPnl = options.longs === String ? "0" : 0;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.side != null && message.hasOwnProperty("side"))
                    object.side = options.enums === String ? $root.alg.live.Side[message.side] === undefined ? message.side : $root.alg.live.Side[message.side] : message.side;
                if (message.qty != null && message.hasOwnProperty("qty"))
                    object.qty = message.qty;
                if (message.avgEntry != null && message.hasOwnProperty("avgEntry"))
                    if (typeof message.avgEntry === "number")
                        object.avgEntry = options.longs === String ? String(message.avgEntry) : message.avgEntry;
                    else
                        object.avgEntry = options.longs === String ? $util.Long.prototype.toString.call(message.avgEntry) : options.longs === Number ? new $util.LongBits(message.avgEntry.low >>> 0, message.avgEntry.high >>> 0).toNumber() : message.avgEntry;
                if (message.unrealizedPnl != null && message.hasOwnProperty("unrealizedPnl"))
                    if (typeof message.unrealizedPnl === "number")
                        object.unrealizedPnl = options.longs === String ? String(message.unrealizedPnl) : message.unrealizedPnl;
                    else
                        object.unrealizedPnl = options.longs === String ? $util.Long.prototype.toString.call(message.unrealizedPnl) : options.longs === Number ? new $util.LongBits(message.unrealizedPnl.low >>> 0, message.unrealizedPnl.high >>> 0).toNumber() : message.unrealizedPnl;
                return object;
            };

            /**
             * Converts this PositionUpdate to JSON.
             * @function toJSON
             * @memberof alg.live.PositionUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PositionUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PositionUpdate
             * @function getTypeUrl
             * @memberof alg.live.PositionUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PositionUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.PositionUpdate";
            };

            return PositionUpdate;
        })();

        live.Snapshot = (function() {

            /**
             * Properties of a Snapshot.
             * @memberof alg.live
             * @interface ISnapshot
             * @property {Array.<alg.live.ICandleUpdate>|null} [currentCandles] Snapshot currentCandles
             * @property {Array.<alg.live.IOrderUpdate>|null} [openOrders] Snapshot openOrders
             * @property {Array.<alg.live.IPositionUpdate>|null} [positions] Snapshot positions
             * @property {alg.live.IAccountUpdate|null} [account] Snapshot account
             */

            /**
             * Constructs a new Snapshot.
             * @memberof alg.live
             * @classdesc Represents a Snapshot.
             * @implements ISnapshot
             * @constructor
             * @param {alg.live.ISnapshot=} [properties] Properties to set
             */
            function Snapshot(properties) {
                this.currentCandles = [];
                this.openOrders = [];
                this.positions = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Snapshot currentCandles.
             * @member {Array.<alg.live.ICandleUpdate>} currentCandles
             * @memberof alg.live.Snapshot
             * @instance
             */
            Snapshot.prototype.currentCandles = $util.emptyArray;

            /**
             * Snapshot openOrders.
             * @member {Array.<alg.live.IOrderUpdate>} openOrders
             * @memberof alg.live.Snapshot
             * @instance
             */
            Snapshot.prototype.openOrders = $util.emptyArray;

            /**
             * Snapshot positions.
             * @member {Array.<alg.live.IPositionUpdate>} positions
             * @memberof alg.live.Snapshot
             * @instance
             */
            Snapshot.prototype.positions = $util.emptyArray;

            /**
             * Snapshot account.
             * @member {alg.live.IAccountUpdate|null|undefined} account
             * @memberof alg.live.Snapshot
             * @instance
             */
            Snapshot.prototype.account = null;

            /**
             * Creates a new Snapshot instance using the specified properties.
             * @function create
             * @memberof alg.live.Snapshot
             * @static
             * @param {alg.live.ISnapshot=} [properties] Properties to set
             * @returns {alg.live.Snapshot} Snapshot instance
             */
            Snapshot.create = function create(properties) {
                return new Snapshot(properties);
            };

            /**
             * Encodes the specified Snapshot message. Does not implicitly {@link alg.live.Snapshot.verify|verify} messages.
             * @function encode
             * @memberof alg.live.Snapshot
             * @static
             * @param {alg.live.ISnapshot} message Snapshot message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Snapshot.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.currentCandles != null && message.currentCandles.length)
                    for (let i = 0; i < message.currentCandles.length; ++i)
                        $root.alg.live.CandleUpdate.encode(message.currentCandles[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.openOrders != null && message.openOrders.length)
                    for (let i = 0; i < message.openOrders.length; ++i)
                        $root.alg.live.OrderUpdate.encode(message.openOrders[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.positions != null && message.positions.length)
                    for (let i = 0; i < message.positions.length; ++i)
                        $root.alg.live.PositionUpdate.encode(message.positions[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.account != null && Object.hasOwnProperty.call(message, "account"))
                    $root.alg.live.AccountUpdate.encode(message.account, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Snapshot message, length delimited. Does not implicitly {@link alg.live.Snapshot.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.Snapshot
             * @static
             * @param {alg.live.ISnapshot} message Snapshot message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Snapshot.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Snapshot message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.Snapshot
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.Snapshot} Snapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Snapshot.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.Snapshot();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.currentCandles && message.currentCandles.length))
                                message.currentCandles = [];
                            message.currentCandles.push($root.alg.live.CandleUpdate.decode(reader, reader.uint32()));
                            break;
                        }
                    case 2: {
                            if (!(message.openOrders && message.openOrders.length))
                                message.openOrders = [];
                            message.openOrders.push($root.alg.live.OrderUpdate.decode(reader, reader.uint32()));
                            break;
                        }
                    case 3: {
                            if (!(message.positions && message.positions.length))
                                message.positions = [];
                            message.positions.push($root.alg.live.PositionUpdate.decode(reader, reader.uint32()));
                            break;
                        }
                    case 4: {
                            message.account = $root.alg.live.AccountUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Snapshot message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.Snapshot
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.Snapshot} Snapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Snapshot.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Snapshot message.
             * @function verify
             * @memberof alg.live.Snapshot
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Snapshot.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.currentCandles != null && message.hasOwnProperty("currentCandles")) {
                    if (!Array.isArray(message.currentCandles))
                        return "currentCandles: array expected";
                    for (let i = 0; i < message.currentCandles.length; ++i) {
                        let error = $root.alg.live.CandleUpdate.verify(message.currentCandles[i]);
                        if (error)
                            return "currentCandles." + error;
                    }
                }
                if (message.openOrders != null && message.hasOwnProperty("openOrders")) {
                    if (!Array.isArray(message.openOrders))
                        return "openOrders: array expected";
                    for (let i = 0; i < message.openOrders.length; ++i) {
                        let error = $root.alg.live.OrderUpdate.verify(message.openOrders[i]);
                        if (error)
                            return "openOrders." + error;
                    }
                }
                if (message.positions != null && message.hasOwnProperty("positions")) {
                    if (!Array.isArray(message.positions))
                        return "positions: array expected";
                    for (let i = 0; i < message.positions.length; ++i) {
                        let error = $root.alg.live.PositionUpdate.verify(message.positions[i]);
                        if (error)
                            return "positions." + error;
                    }
                }
                if (message.account != null && message.hasOwnProperty("account")) {
                    let error = $root.alg.live.AccountUpdate.verify(message.account);
                    if (error)
                        return "account." + error;
                }
                return null;
            };

            /**
             * Creates a Snapshot message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.Snapshot
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.Snapshot} Snapshot
             */
            Snapshot.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.Snapshot)
                    return object;
                let message = new $root.alg.live.Snapshot();
                if (object.currentCandles) {
                    if (!Array.isArray(object.currentCandles))
                        throw TypeError(".alg.live.Snapshot.currentCandles: array expected");
                    message.currentCandles = [];
                    for (let i = 0; i < object.currentCandles.length; ++i) {
                        if (typeof object.currentCandles[i] !== "object")
                            throw TypeError(".alg.live.Snapshot.currentCandles: object expected");
                        message.currentCandles[i] = $root.alg.live.CandleUpdate.fromObject(object.currentCandles[i]);
                    }
                }
                if (object.openOrders) {
                    if (!Array.isArray(object.openOrders))
                        throw TypeError(".alg.live.Snapshot.openOrders: array expected");
                    message.openOrders = [];
                    for (let i = 0; i < object.openOrders.length; ++i) {
                        if (typeof object.openOrders[i] !== "object")
                            throw TypeError(".alg.live.Snapshot.openOrders: object expected");
                        message.openOrders[i] = $root.alg.live.OrderUpdate.fromObject(object.openOrders[i]);
                    }
                }
                if (object.positions) {
                    if (!Array.isArray(object.positions))
                        throw TypeError(".alg.live.Snapshot.positions: array expected");
                    message.positions = [];
                    for (let i = 0; i < object.positions.length; ++i) {
                        if (typeof object.positions[i] !== "object")
                            throw TypeError(".alg.live.Snapshot.positions: object expected");
                        message.positions[i] = $root.alg.live.PositionUpdate.fromObject(object.positions[i]);
                    }
                }
                if (object.account != null) {
                    if (typeof object.account !== "object")
                        throw TypeError(".alg.live.Snapshot.account: object expected");
                    message.account = $root.alg.live.AccountUpdate.fromObject(object.account);
                }
                return message;
            };

            /**
             * Creates a plain object from a Snapshot message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.Snapshot
             * @static
             * @param {alg.live.Snapshot} message Snapshot
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Snapshot.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.currentCandles = [];
                    object.openOrders = [];
                    object.positions = [];
                }
                if (options.defaults)
                    object.account = null;
                if (message.currentCandles && message.currentCandles.length) {
                    object.currentCandles = [];
                    for (let j = 0; j < message.currentCandles.length; ++j)
                        object.currentCandles[j] = $root.alg.live.CandleUpdate.toObject(message.currentCandles[j], options);
                }
                if (message.openOrders && message.openOrders.length) {
                    object.openOrders = [];
                    for (let j = 0; j < message.openOrders.length; ++j)
                        object.openOrders[j] = $root.alg.live.OrderUpdate.toObject(message.openOrders[j], options);
                }
                if (message.positions && message.positions.length) {
                    object.positions = [];
                    for (let j = 0; j < message.positions.length; ++j)
                        object.positions[j] = $root.alg.live.PositionUpdate.toObject(message.positions[j], options);
                }
                if (message.account != null && message.hasOwnProperty("account"))
                    object.account = $root.alg.live.AccountUpdate.toObject(message.account, options);
                return object;
            };

            /**
             * Converts this Snapshot to JSON.
             * @function toJSON
             * @memberof alg.live.Snapshot
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Snapshot.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Snapshot
             * @function getTypeUrl
             * @memberof alg.live.Snapshot
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Snapshot.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.Snapshot";
            };

            return Snapshot;
        })();

        /**
         * Side enum.
         * @name alg.live.Side
         * @enum {number}
         * @property {number} SIDE_UNKNOWN=0 SIDE_UNKNOWN value
         * @property {number} BUY=1 BUY value
         * @property {number} SELL=2 SELL value
         */
        live.Side = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "SIDE_UNKNOWN"] = 0;
            values[valuesById[1] = "BUY"] = 1;
            values[valuesById[2] = "SELL"] = 2;
            return values;
        })();

        /**
         * OrderType enum.
         * @name alg.live.OrderType
         * @enum {number}
         * @property {number} ORDER_TYPE_UNKNOWN=0 ORDER_TYPE_UNKNOWN value
         * @property {number} MARKET=1 MARKET value
         * @property {number} LIMIT=2 LIMIT value
         * @property {number} STOP=3 STOP value
         * @property {number} STOP_LIMIT=4 STOP_LIMIT value
         */
        live.OrderType = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "ORDER_TYPE_UNKNOWN"] = 0;
            values[valuesById[1] = "MARKET"] = 1;
            values[valuesById[2] = "LIMIT"] = 2;
            values[valuesById[3] = "STOP"] = 3;
            values[valuesById[4] = "STOP_LIMIT"] = 4;
            return values;
        })();

        /**
         * OrderStatus enum.
         * @name alg.live.OrderStatus
         * @enum {number}
         * @property {number} ORDER_STATUS_UNKNOWN=0 ORDER_STATUS_UNKNOWN value
         * @property {number} PENDING=1 PENDING value
         * @property {number} ACCEPTED=2 ACCEPTED value
         * @property {number} WORKING=3 WORKING value
         * @property {number} PARTIAL_FILL=4 PARTIAL_FILL value
         * @property {number} FILLED=5 FILLED value
         * @property {number} CANCELLED=6 CANCELLED value
         * @property {number} REJECTED=7 REJECTED value
         */
        live.OrderStatus = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "ORDER_STATUS_UNKNOWN"] = 0;
            values[valuesById[1] = "PENDING"] = 1;
            values[valuesById[2] = "ACCEPTED"] = 2;
            values[valuesById[3] = "WORKING"] = 3;
            values[valuesById[4] = "PARTIAL_FILL"] = 4;
            values[valuesById[5] = "FILLED"] = 5;
            values[valuesById[6] = "CANCELLED"] = 6;
            values[valuesById[7] = "REJECTED"] = 7;
            return values;
        })();

        /**
         * Timeframe enum.
         * @name alg.live.Timeframe
         * @enum {number}
         * @property {number} TIMEFRAME_UNKNOWN=0 TIMEFRAME_UNKNOWN value
         * @property {number} S1=1 S1 value
         * @property {number} S5=2 S5 value
         * @property {number} M1=3 M1 value
         * @property {number} M5=4 M5 value
         * @property {number} M15=5 M15 value
         * @property {number} H1=6 H1 value
         * @property {number} H4=7 H4 value
         * @property {number} D1=8 D1 value
         */
        live.Timeframe = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "TIMEFRAME_UNKNOWN"] = 0;
            values[valuesById[1] = "S1"] = 1;
            values[valuesById[2] = "S5"] = 2;
            values[valuesById[3] = "M1"] = 3;
            values[valuesById[4] = "M5"] = 4;
            values[valuesById[5] = "M15"] = 5;
            values[valuesById[6] = "H1"] = 6;
            values[valuesById[7] = "H4"] = 7;
            values[valuesById[8] = "D1"] = 8;
            return values;
        })();

        /**
         * DataMode enum.
         * @name alg.live.DataMode
         * @enum {number}
         * @property {number} DATA_MODE_UNKNOWN=0 DATA_MODE_UNKNOWN value
         * @property {number} DATA_MOCK=1 DATA_MOCK value
         * @property {number} DATA_LIVE=2 DATA_LIVE value
         */
        live.DataMode = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "DATA_MODE_UNKNOWN"] = 0;
            values[valuesById[1] = "DATA_MOCK"] = 1;
            values[valuesById[2] = "DATA_LIVE"] = 2;
            return values;
        })();

        /**
         * TradeMode enum.
         * @name alg.live.TradeMode
         * @enum {number}
         * @property {number} TRADE_MODE_UNKNOWN=0 TRADE_MODE_UNKNOWN value
         * @property {number} TRADE_PAPER=1 TRADE_PAPER value
         * @property {number} TRADE_LIVE=2 TRADE_LIVE value
         */
        live.TradeMode = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "TRADE_MODE_UNKNOWN"] = 0;
            values[valuesById[1] = "TRADE_PAPER"] = 1;
            values[valuesById[2] = "TRADE_LIVE"] = 2;
            return values;
        })();

        /**
         * DataProvider enum.
         * @name alg.live.DataProvider
         * @enum {number}
         * @property {number} DATA_PROVIDER_NONE=0 DATA_PROVIDER_NONE value
         * @property {number} DATA_PROVIDER_RITHMIC=1 DATA_PROVIDER_RITHMIC value
         * @property {number} DATA_PROVIDER_DATABENTO=2 DATA_PROVIDER_DATABENTO value
         */
        live.DataProvider = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "DATA_PROVIDER_NONE"] = 0;
            values[valuesById[1] = "DATA_PROVIDER_RITHMIC"] = 1;
            values[valuesById[2] = "DATA_PROVIDER_DATABENTO"] = 2;
            return values;
        })();

        /**
         * HistoricalSource enum.
         * @name alg.live.HistoricalSource
         * @enum {number}
         * @property {number} HISTORICAL_AUTO=0 HISTORICAL_AUTO value
         * @property {number} HISTORICAL_RITHMIC=1 HISTORICAL_RITHMIC value
         * @property {number} HISTORICAL_DATABENTO=2 HISTORICAL_DATABENTO value
         * @property {number} HISTORICAL_NONE=3 HISTORICAL_NONE value
         */
        live.HistoricalSource = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "HISTORICAL_AUTO"] = 0;
            values[valuesById[1] = "HISTORICAL_RITHMIC"] = 1;
            values[valuesById[2] = "HISTORICAL_DATABENTO"] = 2;
            values[valuesById[3] = "HISTORICAL_NONE"] = 3;
            return values;
        })();

        /**
         * BracketType enum.
         * @name alg.live.BracketType
         * @enum {number}
         * @property {number} BRACKET_TYPE_UNKNOWN=0 BRACKET_TYPE_UNKNOWN value
         * @property {number} BRACKET_ENTRY=1 BRACKET_ENTRY value
         * @property {number} BRACKET_TAKE_PROFIT=2 BRACKET_TAKE_PROFIT value
         * @property {number} BRACKET_STOP_LOSS=3 BRACKET_STOP_LOSS value
         */
        live.BracketType = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "BRACKET_TYPE_UNKNOWN"] = 0;
            values[valuesById[1] = "BRACKET_ENTRY"] = 1;
            values[valuesById[2] = "BRACKET_TAKE_PROFIT"] = 2;
            values[valuesById[3] = "BRACKET_STOP_LOSS"] = 3;
            return values;
        })();

        live.PlaceOrder = (function() {

            /**
             * Properties of a PlaceOrder.
             * @memberof alg.live
             * @interface IPlaceOrder
             * @property {string|null} [requestId] PlaceOrder requestId
             * @property {string|null} [clientOrderId] PlaceOrder clientOrderId
             * @property {string|null} [symbol] PlaceOrder symbol
             * @property {alg.live.Side|null} [side] PlaceOrder side
             * @property {number|null} [qty] PlaceOrder qty
             * @property {alg.live.OrderType|null} [orderType] PlaceOrder orderType
             * @property {number|Long|null} [limitPrice] PlaceOrder limitPrice
             * @property {number|Long|null} [stopPrice] PlaceOrder stopPrice
             * @property {string|null} [source] PlaceOrder source
             */

            /**
             * Constructs a new PlaceOrder.
             * @memberof alg.live
             * @classdesc Represents a PlaceOrder.
             * @implements IPlaceOrder
             * @constructor
             * @param {alg.live.IPlaceOrder=} [properties] Properties to set
             */
            function PlaceOrder(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PlaceOrder requestId.
             * @member {string} requestId
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.requestId = "";

            /**
             * PlaceOrder clientOrderId.
             * @member {string} clientOrderId
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.clientOrderId = "";

            /**
             * PlaceOrder symbol.
             * @member {string} symbol
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.symbol = "";

            /**
             * PlaceOrder side.
             * @member {alg.live.Side} side
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.side = 0;

            /**
             * PlaceOrder qty.
             * @member {number} qty
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.qty = 0;

            /**
             * PlaceOrder orderType.
             * @member {alg.live.OrderType} orderType
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.orderType = 0;

            /**
             * PlaceOrder limitPrice.
             * @member {number|Long|null|undefined} limitPrice
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.limitPrice = null;

            /**
             * PlaceOrder stopPrice.
             * @member {number|Long|null|undefined} stopPrice
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.stopPrice = null;

            /**
             * PlaceOrder source.
             * @member {string} source
             * @memberof alg.live.PlaceOrder
             * @instance
             */
            PlaceOrder.prototype.source = "";

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(PlaceOrder.prototype, "_limitPrice", {
                get: $util.oneOfGetter($oneOfFields = ["limitPrice"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(PlaceOrder.prototype, "_stopPrice", {
                get: $util.oneOfGetter($oneOfFields = ["stopPrice"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new PlaceOrder instance using the specified properties.
             * @function create
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {alg.live.IPlaceOrder=} [properties] Properties to set
             * @returns {alg.live.PlaceOrder} PlaceOrder instance
             */
            PlaceOrder.create = function create(properties) {
                return new PlaceOrder(properties);
            };

            /**
             * Encodes the specified PlaceOrder message. Does not implicitly {@link alg.live.PlaceOrder.verify|verify} messages.
             * @function encode
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {alg.live.IPlaceOrder} message PlaceOrder message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlaceOrder.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.requestId != null && Object.hasOwnProperty.call(message, "requestId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.requestId);
                if (message.clientOrderId != null && Object.hasOwnProperty.call(message, "clientOrderId"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.clientOrderId);
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.symbol);
                if (message.side != null && Object.hasOwnProperty.call(message, "side"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.side);
                if (message.qty != null && Object.hasOwnProperty.call(message, "qty"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.qty);
                if (message.orderType != null && Object.hasOwnProperty.call(message, "orderType"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int32(message.orderType);
                if (message.limitPrice != null && Object.hasOwnProperty.call(message, "limitPrice"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int64(message.limitPrice);
                if (message.stopPrice != null && Object.hasOwnProperty.call(message, "stopPrice"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.stopPrice);
                if (message.source != null && Object.hasOwnProperty.call(message, "source"))
                    writer.uint32(/* id 9, wireType 2 =*/74).string(message.source);
                return writer;
            };

            /**
             * Encodes the specified PlaceOrder message, length delimited. Does not implicitly {@link alg.live.PlaceOrder.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {alg.live.IPlaceOrder} message PlaceOrder message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlaceOrder.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PlaceOrder message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.PlaceOrder} PlaceOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlaceOrder.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.PlaceOrder();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.requestId = reader.string();
                            break;
                        }
                    case 2: {
                            message.clientOrderId = reader.string();
                            break;
                        }
                    case 3: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 4: {
                            message.side = reader.int32();
                            break;
                        }
                    case 5: {
                            message.qty = reader.int32();
                            break;
                        }
                    case 6: {
                            message.orderType = reader.int32();
                            break;
                        }
                    case 7: {
                            message.limitPrice = reader.int64();
                            break;
                        }
                    case 8: {
                            message.stopPrice = reader.int64();
                            break;
                        }
                    case 9: {
                            message.source = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PlaceOrder message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.PlaceOrder} PlaceOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlaceOrder.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PlaceOrder message.
             * @function verify
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PlaceOrder.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    if (!$util.isString(message.requestId))
                        return "requestId: string expected";
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    if (!$util.isString(message.clientOrderId))
                        return "clientOrderId: string expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.side != null && message.hasOwnProperty("side"))
                    switch (message.side) {
                    default:
                        return "side: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.qty != null && message.hasOwnProperty("qty"))
                    if (!$util.isInteger(message.qty))
                        return "qty: integer expected";
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    switch (message.orderType) {
                    default:
                        return "orderType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.limitPrice != null && message.hasOwnProperty("limitPrice")) {
                    properties._limitPrice = 1;
                    if (!$util.isInteger(message.limitPrice) && !(message.limitPrice && $util.isInteger(message.limitPrice.low) && $util.isInteger(message.limitPrice.high)))
                        return "limitPrice: integer|Long expected";
                }
                if (message.stopPrice != null && message.hasOwnProperty("stopPrice")) {
                    properties._stopPrice = 1;
                    if (!$util.isInteger(message.stopPrice) && !(message.stopPrice && $util.isInteger(message.stopPrice.low) && $util.isInteger(message.stopPrice.high)))
                        return "stopPrice: integer|Long expected";
                }
                if (message.source != null && message.hasOwnProperty("source"))
                    if (!$util.isString(message.source))
                        return "source: string expected";
                return null;
            };

            /**
             * Creates a PlaceOrder message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.PlaceOrder} PlaceOrder
             */
            PlaceOrder.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.PlaceOrder)
                    return object;
                let message = new $root.alg.live.PlaceOrder();
                if (object.requestId != null)
                    message.requestId = String(object.requestId);
                if (object.clientOrderId != null)
                    message.clientOrderId = String(object.clientOrderId);
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.side) {
                default:
                    if (typeof object.side === "number") {
                        message.side = object.side;
                        break;
                    }
                    break;
                case "SIDE_UNKNOWN":
                case 0:
                    message.side = 0;
                    break;
                case "BUY":
                case 1:
                    message.side = 1;
                    break;
                case "SELL":
                case 2:
                    message.side = 2;
                    break;
                }
                if (object.qty != null)
                    message.qty = object.qty | 0;
                switch (object.orderType) {
                default:
                    if (typeof object.orderType === "number") {
                        message.orderType = object.orderType;
                        break;
                    }
                    break;
                case "ORDER_TYPE_UNKNOWN":
                case 0:
                    message.orderType = 0;
                    break;
                case "MARKET":
                case 1:
                    message.orderType = 1;
                    break;
                case "LIMIT":
                case 2:
                    message.orderType = 2;
                    break;
                case "STOP":
                case 3:
                    message.orderType = 3;
                    break;
                case "STOP_LIMIT":
                case 4:
                    message.orderType = 4;
                    break;
                }
                if (object.limitPrice != null)
                    if ($util.Long)
                        (message.limitPrice = $util.Long.fromValue(object.limitPrice)).unsigned = false;
                    else if (typeof object.limitPrice === "string")
                        message.limitPrice = parseInt(object.limitPrice, 10);
                    else if (typeof object.limitPrice === "number")
                        message.limitPrice = object.limitPrice;
                    else if (typeof object.limitPrice === "object")
                        message.limitPrice = new $util.LongBits(object.limitPrice.low >>> 0, object.limitPrice.high >>> 0).toNumber();
                if (object.stopPrice != null)
                    if ($util.Long)
                        (message.stopPrice = $util.Long.fromValue(object.stopPrice)).unsigned = false;
                    else if (typeof object.stopPrice === "string")
                        message.stopPrice = parseInt(object.stopPrice, 10);
                    else if (typeof object.stopPrice === "number")
                        message.stopPrice = object.stopPrice;
                    else if (typeof object.stopPrice === "object")
                        message.stopPrice = new $util.LongBits(object.stopPrice.low >>> 0, object.stopPrice.high >>> 0).toNumber();
                if (object.source != null)
                    message.source = String(object.source);
                return message;
            };

            /**
             * Creates a plain object from a PlaceOrder message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {alg.live.PlaceOrder} message PlaceOrder
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PlaceOrder.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.requestId = "";
                    object.clientOrderId = "";
                    object.symbol = "";
                    object.side = options.enums === String ? "SIDE_UNKNOWN" : 0;
                    object.qty = 0;
                    object.orderType = options.enums === String ? "ORDER_TYPE_UNKNOWN" : 0;
                    object.source = "";
                }
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    object.requestId = message.requestId;
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    object.clientOrderId = message.clientOrderId;
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.side != null && message.hasOwnProperty("side"))
                    object.side = options.enums === String ? $root.alg.live.Side[message.side] === undefined ? message.side : $root.alg.live.Side[message.side] : message.side;
                if (message.qty != null && message.hasOwnProperty("qty"))
                    object.qty = message.qty;
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    object.orderType = options.enums === String ? $root.alg.live.OrderType[message.orderType] === undefined ? message.orderType : $root.alg.live.OrderType[message.orderType] : message.orderType;
                if (message.limitPrice != null && message.hasOwnProperty("limitPrice")) {
                    if (typeof message.limitPrice === "number")
                        object.limitPrice = options.longs === String ? String(message.limitPrice) : message.limitPrice;
                    else
                        object.limitPrice = options.longs === String ? $util.Long.prototype.toString.call(message.limitPrice) : options.longs === Number ? new $util.LongBits(message.limitPrice.low >>> 0, message.limitPrice.high >>> 0).toNumber() : message.limitPrice;
                    if (options.oneofs)
                        object._limitPrice = "limitPrice";
                }
                if (message.stopPrice != null && message.hasOwnProperty("stopPrice")) {
                    if (typeof message.stopPrice === "number")
                        object.stopPrice = options.longs === String ? String(message.stopPrice) : message.stopPrice;
                    else
                        object.stopPrice = options.longs === String ? $util.Long.prototype.toString.call(message.stopPrice) : options.longs === Number ? new $util.LongBits(message.stopPrice.low >>> 0, message.stopPrice.high >>> 0).toNumber() : message.stopPrice;
                    if (options.oneofs)
                        object._stopPrice = "stopPrice";
                }
                if (message.source != null && message.hasOwnProperty("source"))
                    object.source = message.source;
                return object;
            };

            /**
             * Converts this PlaceOrder to JSON.
             * @function toJSON
             * @memberof alg.live.PlaceOrder
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PlaceOrder.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PlaceOrder
             * @function getTypeUrl
             * @memberof alg.live.PlaceOrder
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PlaceOrder.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.PlaceOrder";
            };

            return PlaceOrder;
        })();

        live.PlaceBracket = (function() {

            /**
             * Properties of a PlaceBracket.
             * @memberof alg.live
             * @interface IPlaceBracket
             * @property {string|null} [requestId] PlaceBracket requestId
             * @property {string|null} [clientOrderId] PlaceBracket clientOrderId
             * @property {string|null} [correlationId] PlaceBracket correlationId
             * @property {string|null} [symbol] PlaceBracket symbol
             * @property {alg.live.Side|null} [side] PlaceBracket side
             * @property {number|null} [qty] PlaceBracket qty
             * @property {number|Long|null} [entryPrice] PlaceBracket entryPrice
             * @property {number|Long|null} [stopLoss] PlaceBracket stopLoss
             * @property {number|Long|null} [takeProfit] PlaceBracket takeProfit
             */

            /**
             * Constructs a new PlaceBracket.
             * @memberof alg.live
             * @classdesc Represents a PlaceBracket.
             * @implements IPlaceBracket
             * @constructor
             * @param {alg.live.IPlaceBracket=} [properties] Properties to set
             */
            function PlaceBracket(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PlaceBracket requestId.
             * @member {string} requestId
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.requestId = "";

            /**
             * PlaceBracket clientOrderId.
             * @member {string} clientOrderId
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.clientOrderId = "";

            /**
             * PlaceBracket correlationId.
             * @member {string} correlationId
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.correlationId = "";

            /**
             * PlaceBracket symbol.
             * @member {string} symbol
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.symbol = "";

            /**
             * PlaceBracket side.
             * @member {alg.live.Side} side
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.side = 0;

            /**
             * PlaceBracket qty.
             * @member {number} qty
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.qty = 0;

            /**
             * PlaceBracket entryPrice.
             * @member {number|Long} entryPrice
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.entryPrice = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * PlaceBracket stopLoss.
             * @member {number|Long} stopLoss
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.stopLoss = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * PlaceBracket takeProfit.
             * @member {number|Long} takeProfit
             * @memberof alg.live.PlaceBracket
             * @instance
             */
            PlaceBracket.prototype.takeProfit = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new PlaceBracket instance using the specified properties.
             * @function create
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {alg.live.IPlaceBracket=} [properties] Properties to set
             * @returns {alg.live.PlaceBracket} PlaceBracket instance
             */
            PlaceBracket.create = function create(properties) {
                return new PlaceBracket(properties);
            };

            /**
             * Encodes the specified PlaceBracket message. Does not implicitly {@link alg.live.PlaceBracket.verify|verify} messages.
             * @function encode
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {alg.live.IPlaceBracket} message PlaceBracket message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlaceBracket.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.requestId != null && Object.hasOwnProperty.call(message, "requestId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.requestId);
                if (message.clientOrderId != null && Object.hasOwnProperty.call(message, "clientOrderId"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.clientOrderId);
                if (message.correlationId != null && Object.hasOwnProperty.call(message, "correlationId"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.correlationId);
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.symbol);
                if (message.side != null && Object.hasOwnProperty.call(message, "side"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.side);
                if (message.qty != null && Object.hasOwnProperty.call(message, "qty"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int32(message.qty);
                if (message.entryPrice != null && Object.hasOwnProperty.call(message, "entryPrice"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int64(message.entryPrice);
                if (message.stopLoss != null && Object.hasOwnProperty.call(message, "stopLoss"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.stopLoss);
                if (message.takeProfit != null && Object.hasOwnProperty.call(message, "takeProfit"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int64(message.takeProfit);
                return writer;
            };

            /**
             * Encodes the specified PlaceBracket message, length delimited. Does not implicitly {@link alg.live.PlaceBracket.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {alg.live.IPlaceBracket} message PlaceBracket message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlaceBracket.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PlaceBracket message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.PlaceBracket} PlaceBracket
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlaceBracket.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.PlaceBracket();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.requestId = reader.string();
                            break;
                        }
                    case 2: {
                            message.clientOrderId = reader.string();
                            break;
                        }
                    case 3: {
                            message.correlationId = reader.string();
                            break;
                        }
                    case 4: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 5: {
                            message.side = reader.int32();
                            break;
                        }
                    case 6: {
                            message.qty = reader.int32();
                            break;
                        }
                    case 7: {
                            message.entryPrice = reader.int64();
                            break;
                        }
                    case 8: {
                            message.stopLoss = reader.int64();
                            break;
                        }
                    case 9: {
                            message.takeProfit = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PlaceBracket message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.PlaceBracket} PlaceBracket
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlaceBracket.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PlaceBracket message.
             * @function verify
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PlaceBracket.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    if (!$util.isString(message.requestId))
                        return "requestId: string expected";
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    if (!$util.isString(message.clientOrderId))
                        return "clientOrderId: string expected";
                if (message.correlationId != null && message.hasOwnProperty("correlationId"))
                    if (!$util.isString(message.correlationId))
                        return "correlationId: string expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.side != null && message.hasOwnProperty("side"))
                    switch (message.side) {
                    default:
                        return "side: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.qty != null && message.hasOwnProperty("qty"))
                    if (!$util.isInteger(message.qty))
                        return "qty: integer expected";
                if (message.entryPrice != null && message.hasOwnProperty("entryPrice"))
                    if (!$util.isInteger(message.entryPrice) && !(message.entryPrice && $util.isInteger(message.entryPrice.low) && $util.isInteger(message.entryPrice.high)))
                        return "entryPrice: integer|Long expected";
                if (message.stopLoss != null && message.hasOwnProperty("stopLoss"))
                    if (!$util.isInteger(message.stopLoss) && !(message.stopLoss && $util.isInteger(message.stopLoss.low) && $util.isInteger(message.stopLoss.high)))
                        return "stopLoss: integer|Long expected";
                if (message.takeProfit != null && message.hasOwnProperty("takeProfit"))
                    if (!$util.isInteger(message.takeProfit) && !(message.takeProfit && $util.isInteger(message.takeProfit.low) && $util.isInteger(message.takeProfit.high)))
                        return "takeProfit: integer|Long expected";
                return null;
            };

            /**
             * Creates a PlaceBracket message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.PlaceBracket} PlaceBracket
             */
            PlaceBracket.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.PlaceBracket)
                    return object;
                let message = new $root.alg.live.PlaceBracket();
                if (object.requestId != null)
                    message.requestId = String(object.requestId);
                if (object.clientOrderId != null)
                    message.clientOrderId = String(object.clientOrderId);
                if (object.correlationId != null)
                    message.correlationId = String(object.correlationId);
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.side) {
                default:
                    if (typeof object.side === "number") {
                        message.side = object.side;
                        break;
                    }
                    break;
                case "SIDE_UNKNOWN":
                case 0:
                    message.side = 0;
                    break;
                case "BUY":
                case 1:
                    message.side = 1;
                    break;
                case "SELL":
                case 2:
                    message.side = 2;
                    break;
                }
                if (object.qty != null)
                    message.qty = object.qty | 0;
                if (object.entryPrice != null)
                    if ($util.Long)
                        (message.entryPrice = $util.Long.fromValue(object.entryPrice)).unsigned = false;
                    else if (typeof object.entryPrice === "string")
                        message.entryPrice = parseInt(object.entryPrice, 10);
                    else if (typeof object.entryPrice === "number")
                        message.entryPrice = object.entryPrice;
                    else if (typeof object.entryPrice === "object")
                        message.entryPrice = new $util.LongBits(object.entryPrice.low >>> 0, object.entryPrice.high >>> 0).toNumber();
                if (object.stopLoss != null)
                    if ($util.Long)
                        (message.stopLoss = $util.Long.fromValue(object.stopLoss)).unsigned = false;
                    else if (typeof object.stopLoss === "string")
                        message.stopLoss = parseInt(object.stopLoss, 10);
                    else if (typeof object.stopLoss === "number")
                        message.stopLoss = object.stopLoss;
                    else if (typeof object.stopLoss === "object")
                        message.stopLoss = new $util.LongBits(object.stopLoss.low >>> 0, object.stopLoss.high >>> 0).toNumber();
                if (object.takeProfit != null)
                    if ($util.Long)
                        (message.takeProfit = $util.Long.fromValue(object.takeProfit)).unsigned = false;
                    else if (typeof object.takeProfit === "string")
                        message.takeProfit = parseInt(object.takeProfit, 10);
                    else if (typeof object.takeProfit === "number")
                        message.takeProfit = object.takeProfit;
                    else if (typeof object.takeProfit === "object")
                        message.takeProfit = new $util.LongBits(object.takeProfit.low >>> 0, object.takeProfit.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a PlaceBracket message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {alg.live.PlaceBracket} message PlaceBracket
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PlaceBracket.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.requestId = "";
                    object.clientOrderId = "";
                    object.correlationId = "";
                    object.symbol = "";
                    object.side = options.enums === String ? "SIDE_UNKNOWN" : 0;
                    object.qty = 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.entryPrice = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.entryPrice = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.stopLoss = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.stopLoss = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.takeProfit = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.takeProfit = options.longs === String ? "0" : 0;
                }
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    object.requestId = message.requestId;
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    object.clientOrderId = message.clientOrderId;
                if (message.correlationId != null && message.hasOwnProperty("correlationId"))
                    object.correlationId = message.correlationId;
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.side != null && message.hasOwnProperty("side"))
                    object.side = options.enums === String ? $root.alg.live.Side[message.side] === undefined ? message.side : $root.alg.live.Side[message.side] : message.side;
                if (message.qty != null && message.hasOwnProperty("qty"))
                    object.qty = message.qty;
                if (message.entryPrice != null && message.hasOwnProperty("entryPrice"))
                    if (typeof message.entryPrice === "number")
                        object.entryPrice = options.longs === String ? String(message.entryPrice) : message.entryPrice;
                    else
                        object.entryPrice = options.longs === String ? $util.Long.prototype.toString.call(message.entryPrice) : options.longs === Number ? new $util.LongBits(message.entryPrice.low >>> 0, message.entryPrice.high >>> 0).toNumber() : message.entryPrice;
                if (message.stopLoss != null && message.hasOwnProperty("stopLoss"))
                    if (typeof message.stopLoss === "number")
                        object.stopLoss = options.longs === String ? String(message.stopLoss) : message.stopLoss;
                    else
                        object.stopLoss = options.longs === String ? $util.Long.prototype.toString.call(message.stopLoss) : options.longs === Number ? new $util.LongBits(message.stopLoss.low >>> 0, message.stopLoss.high >>> 0).toNumber() : message.stopLoss;
                if (message.takeProfit != null && message.hasOwnProperty("takeProfit"))
                    if (typeof message.takeProfit === "number")
                        object.takeProfit = options.longs === String ? String(message.takeProfit) : message.takeProfit;
                    else
                        object.takeProfit = options.longs === String ? $util.Long.prototype.toString.call(message.takeProfit) : options.longs === Number ? new $util.LongBits(message.takeProfit.low >>> 0, message.takeProfit.high >>> 0).toNumber() : message.takeProfit;
                return object;
            };

            /**
             * Converts this PlaceBracket to JSON.
             * @function toJSON
             * @memberof alg.live.PlaceBracket
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PlaceBracket.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PlaceBracket
             * @function getTypeUrl
             * @memberof alg.live.PlaceBracket
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PlaceBracket.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.PlaceBracket";
            };

            return PlaceBracket;
        })();

        live.ModifyOrder = (function() {

            /**
             * Properties of a ModifyOrder.
             * @memberof alg.live
             * @interface IModifyOrder
             * @property {string|null} [requestId] ModifyOrder requestId
             * @property {string|null} [clientOrderId] ModifyOrder clientOrderId
             * @property {number|Long|null} [newPrice] ModifyOrder newPrice
             */

            /**
             * Constructs a new ModifyOrder.
             * @memberof alg.live
             * @classdesc Represents a ModifyOrder.
             * @implements IModifyOrder
             * @constructor
             * @param {alg.live.IModifyOrder=} [properties] Properties to set
             */
            function ModifyOrder(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ModifyOrder requestId.
             * @member {string} requestId
             * @memberof alg.live.ModifyOrder
             * @instance
             */
            ModifyOrder.prototype.requestId = "";

            /**
             * ModifyOrder clientOrderId.
             * @member {string} clientOrderId
             * @memberof alg.live.ModifyOrder
             * @instance
             */
            ModifyOrder.prototype.clientOrderId = "";

            /**
             * ModifyOrder newPrice.
             * @member {number|Long} newPrice
             * @memberof alg.live.ModifyOrder
             * @instance
             */
            ModifyOrder.prototype.newPrice = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new ModifyOrder instance using the specified properties.
             * @function create
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {alg.live.IModifyOrder=} [properties] Properties to set
             * @returns {alg.live.ModifyOrder} ModifyOrder instance
             */
            ModifyOrder.create = function create(properties) {
                return new ModifyOrder(properties);
            };

            /**
             * Encodes the specified ModifyOrder message. Does not implicitly {@link alg.live.ModifyOrder.verify|verify} messages.
             * @function encode
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {alg.live.IModifyOrder} message ModifyOrder message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ModifyOrder.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.requestId != null && Object.hasOwnProperty.call(message, "requestId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.requestId);
                if (message.clientOrderId != null && Object.hasOwnProperty.call(message, "clientOrderId"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.clientOrderId);
                if (message.newPrice != null && Object.hasOwnProperty.call(message, "newPrice"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int64(message.newPrice);
                return writer;
            };

            /**
             * Encodes the specified ModifyOrder message, length delimited. Does not implicitly {@link alg.live.ModifyOrder.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {alg.live.IModifyOrder} message ModifyOrder message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ModifyOrder.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ModifyOrder message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.ModifyOrder} ModifyOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ModifyOrder.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.ModifyOrder();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.requestId = reader.string();
                            break;
                        }
                    case 2: {
                            message.clientOrderId = reader.string();
                            break;
                        }
                    case 3: {
                            message.newPrice = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ModifyOrder message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.ModifyOrder} ModifyOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ModifyOrder.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ModifyOrder message.
             * @function verify
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ModifyOrder.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    if (!$util.isString(message.requestId))
                        return "requestId: string expected";
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    if (!$util.isString(message.clientOrderId))
                        return "clientOrderId: string expected";
                if (message.newPrice != null && message.hasOwnProperty("newPrice"))
                    if (!$util.isInteger(message.newPrice) && !(message.newPrice && $util.isInteger(message.newPrice.low) && $util.isInteger(message.newPrice.high)))
                        return "newPrice: integer|Long expected";
                return null;
            };

            /**
             * Creates a ModifyOrder message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.ModifyOrder} ModifyOrder
             */
            ModifyOrder.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.ModifyOrder)
                    return object;
                let message = new $root.alg.live.ModifyOrder();
                if (object.requestId != null)
                    message.requestId = String(object.requestId);
                if (object.clientOrderId != null)
                    message.clientOrderId = String(object.clientOrderId);
                if (object.newPrice != null)
                    if ($util.Long)
                        (message.newPrice = $util.Long.fromValue(object.newPrice)).unsigned = false;
                    else if (typeof object.newPrice === "string")
                        message.newPrice = parseInt(object.newPrice, 10);
                    else if (typeof object.newPrice === "number")
                        message.newPrice = object.newPrice;
                    else if (typeof object.newPrice === "object")
                        message.newPrice = new $util.LongBits(object.newPrice.low >>> 0, object.newPrice.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a ModifyOrder message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {alg.live.ModifyOrder} message ModifyOrder
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ModifyOrder.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.requestId = "";
                    object.clientOrderId = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.newPrice = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.newPrice = options.longs === String ? "0" : 0;
                }
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    object.requestId = message.requestId;
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    object.clientOrderId = message.clientOrderId;
                if (message.newPrice != null && message.hasOwnProperty("newPrice"))
                    if (typeof message.newPrice === "number")
                        object.newPrice = options.longs === String ? String(message.newPrice) : message.newPrice;
                    else
                        object.newPrice = options.longs === String ? $util.Long.prototype.toString.call(message.newPrice) : options.longs === Number ? new $util.LongBits(message.newPrice.low >>> 0, message.newPrice.high >>> 0).toNumber() : message.newPrice;
                return object;
            };

            /**
             * Converts this ModifyOrder to JSON.
             * @function toJSON
             * @memberof alg.live.ModifyOrder
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ModifyOrder.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ModifyOrder
             * @function getTypeUrl
             * @memberof alg.live.ModifyOrder
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ModifyOrder.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.ModifyOrder";
            };

            return ModifyOrder;
        })();

        live.CancelOrder = (function() {

            /**
             * Properties of a CancelOrder.
             * @memberof alg.live
             * @interface ICancelOrder
             * @property {string|null} [requestId] CancelOrder requestId
             * @property {string|null} [clientOrderId] CancelOrder clientOrderId
             */

            /**
             * Constructs a new CancelOrder.
             * @memberof alg.live
             * @classdesc Represents a CancelOrder.
             * @implements ICancelOrder
             * @constructor
             * @param {alg.live.ICancelOrder=} [properties] Properties to set
             */
            function CancelOrder(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CancelOrder requestId.
             * @member {string} requestId
             * @memberof alg.live.CancelOrder
             * @instance
             */
            CancelOrder.prototype.requestId = "";

            /**
             * CancelOrder clientOrderId.
             * @member {string} clientOrderId
             * @memberof alg.live.CancelOrder
             * @instance
             */
            CancelOrder.prototype.clientOrderId = "";

            /**
             * Creates a new CancelOrder instance using the specified properties.
             * @function create
             * @memberof alg.live.CancelOrder
             * @static
             * @param {alg.live.ICancelOrder=} [properties] Properties to set
             * @returns {alg.live.CancelOrder} CancelOrder instance
             */
            CancelOrder.create = function create(properties) {
                return new CancelOrder(properties);
            };

            /**
             * Encodes the specified CancelOrder message. Does not implicitly {@link alg.live.CancelOrder.verify|verify} messages.
             * @function encode
             * @memberof alg.live.CancelOrder
             * @static
             * @param {alg.live.ICancelOrder} message CancelOrder message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CancelOrder.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.requestId != null && Object.hasOwnProperty.call(message, "requestId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.requestId);
                if (message.clientOrderId != null && Object.hasOwnProperty.call(message, "clientOrderId"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.clientOrderId);
                return writer;
            };

            /**
             * Encodes the specified CancelOrder message, length delimited. Does not implicitly {@link alg.live.CancelOrder.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.CancelOrder
             * @static
             * @param {alg.live.ICancelOrder} message CancelOrder message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CancelOrder.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CancelOrder message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.CancelOrder
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.CancelOrder} CancelOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CancelOrder.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.CancelOrder();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.requestId = reader.string();
                            break;
                        }
                    case 2: {
                            message.clientOrderId = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CancelOrder message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.CancelOrder
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.CancelOrder} CancelOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CancelOrder.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CancelOrder message.
             * @function verify
             * @memberof alg.live.CancelOrder
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CancelOrder.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    if (!$util.isString(message.requestId))
                        return "requestId: string expected";
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    if (!$util.isString(message.clientOrderId))
                        return "clientOrderId: string expected";
                return null;
            };

            /**
             * Creates a CancelOrder message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.CancelOrder
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.CancelOrder} CancelOrder
             */
            CancelOrder.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.CancelOrder)
                    return object;
                let message = new $root.alg.live.CancelOrder();
                if (object.requestId != null)
                    message.requestId = String(object.requestId);
                if (object.clientOrderId != null)
                    message.clientOrderId = String(object.clientOrderId);
                return message;
            };

            /**
             * Creates a plain object from a CancelOrder message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.CancelOrder
             * @static
             * @param {alg.live.CancelOrder} message CancelOrder
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CancelOrder.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.requestId = "";
                    object.clientOrderId = "";
                }
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    object.requestId = message.requestId;
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    object.clientOrderId = message.clientOrderId;
                return object;
            };

            /**
             * Converts this CancelOrder to JSON.
             * @function toJSON
             * @memberof alg.live.CancelOrder
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CancelOrder.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for CancelOrder
             * @function getTypeUrl
             * @memberof alg.live.CancelOrder
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            CancelOrder.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.CancelOrder";
            };

            return CancelOrder;
        })();

        live.OrderUpdate = (function() {

            /**
             * Properties of an OrderUpdate.
             * @memberof alg.live
             * @interface IOrderUpdate
             * @property {string|null} [requestId] OrderUpdate requestId
             * @property {string|null} [clientOrderId] OrderUpdate clientOrderId
             * @property {string|null} [exchangeOrderId] OrderUpdate exchangeOrderId
             * @property {alg.live.OrderStatus|null} [status] OrderUpdate status
             * @property {number|null} [filledQty] OrderUpdate filledQty
             * @property {number|Long|null} [avgFillPrice] OrderUpdate avgFillPrice
             * @property {string|null} [rejectReason] OrderUpdate rejectReason
             * @property {number|Long|null} [timestamp] OrderUpdate timestamp
             * @property {string|null} [symbol] OrderUpdate symbol
             * @property {alg.live.Side|null} [side] OrderUpdate side
             * @property {number|null} [qty] OrderUpdate qty
             * @property {alg.live.OrderType|null} [orderType] OrderUpdate orderType
             * @property {number|Long|null} [limitPrice] OrderUpdate limitPrice
             * @property {number|Long|null} [stopPrice] OrderUpdate stopPrice
             * @property {string|null} [bracketId] OrderUpdate bracketId
             * @property {alg.live.BracketType|null} [bracketType] OrderUpdate bracketType
             */

            /**
             * Constructs a new OrderUpdate.
             * @memberof alg.live
             * @classdesc Represents an OrderUpdate.
             * @implements IOrderUpdate
             * @constructor
             * @param {alg.live.IOrderUpdate=} [properties] Properties to set
             */
            function OrderUpdate(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * OrderUpdate requestId.
             * @member {string} requestId
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.requestId = "";

            /**
             * OrderUpdate clientOrderId.
             * @member {string} clientOrderId
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.clientOrderId = "";

            /**
             * OrderUpdate exchangeOrderId.
             * @member {string} exchangeOrderId
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.exchangeOrderId = "";

            /**
             * OrderUpdate status.
             * @member {alg.live.OrderStatus} status
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.status = 0;

            /**
             * OrderUpdate filledQty.
             * @member {number} filledQty
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.filledQty = 0;

            /**
             * OrderUpdate avgFillPrice.
             * @member {number|Long|null|undefined} avgFillPrice
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.avgFillPrice = null;

            /**
             * OrderUpdate rejectReason.
             * @member {string|null|undefined} rejectReason
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.rejectReason = null;

            /**
             * OrderUpdate timestamp.
             * @member {number|Long} timestamp
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * OrderUpdate symbol.
             * @member {string} symbol
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.symbol = "";

            /**
             * OrderUpdate side.
             * @member {alg.live.Side} side
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.side = 0;

            /**
             * OrderUpdate qty.
             * @member {number} qty
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.qty = 0;

            /**
             * OrderUpdate orderType.
             * @member {alg.live.OrderType} orderType
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.orderType = 0;

            /**
             * OrderUpdate limitPrice.
             * @member {number|Long|null|undefined} limitPrice
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.limitPrice = null;

            /**
             * OrderUpdate stopPrice.
             * @member {number|Long|null|undefined} stopPrice
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.stopPrice = null;

            /**
             * OrderUpdate bracketId.
             * @member {string|null|undefined} bracketId
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.bracketId = null;

            /**
             * OrderUpdate bracketType.
             * @member {alg.live.BracketType|null|undefined} bracketType
             * @memberof alg.live.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.bracketType = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(OrderUpdate.prototype, "_avgFillPrice", {
                get: $util.oneOfGetter($oneOfFields = ["avgFillPrice"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(OrderUpdate.prototype, "_rejectReason", {
                get: $util.oneOfGetter($oneOfFields = ["rejectReason"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(OrderUpdate.prototype, "_limitPrice", {
                get: $util.oneOfGetter($oneOfFields = ["limitPrice"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(OrderUpdate.prototype, "_stopPrice", {
                get: $util.oneOfGetter($oneOfFields = ["stopPrice"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(OrderUpdate.prototype, "_bracketId", {
                get: $util.oneOfGetter($oneOfFields = ["bracketId"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(OrderUpdate.prototype, "_bracketType", {
                get: $util.oneOfGetter($oneOfFields = ["bracketType"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new OrderUpdate instance using the specified properties.
             * @function create
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {alg.live.IOrderUpdate=} [properties] Properties to set
             * @returns {alg.live.OrderUpdate} OrderUpdate instance
             */
            OrderUpdate.create = function create(properties) {
                return new OrderUpdate(properties);
            };

            /**
             * Encodes the specified OrderUpdate message. Does not implicitly {@link alg.live.OrderUpdate.verify|verify} messages.
             * @function encode
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {alg.live.IOrderUpdate} message OrderUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OrderUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.requestId != null && Object.hasOwnProperty.call(message, "requestId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.requestId);
                if (message.clientOrderId != null && Object.hasOwnProperty.call(message, "clientOrderId"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.clientOrderId);
                if (message.exchangeOrderId != null && Object.hasOwnProperty.call(message, "exchangeOrderId"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.exchangeOrderId);
                if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.status);
                if (message.filledQty != null && Object.hasOwnProperty.call(message, "filledQty"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.filledQty);
                if (message.avgFillPrice != null && Object.hasOwnProperty.call(message, "avgFillPrice"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int64(message.avgFillPrice);
                if (message.rejectReason != null && Object.hasOwnProperty.call(message, "rejectReason"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.rejectReason);
                if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.timestamp);
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 9, wireType 2 =*/74).string(message.symbol);
                if (message.side != null && Object.hasOwnProperty.call(message, "side"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int32(message.side);
                if (message.qty != null && Object.hasOwnProperty.call(message, "qty"))
                    writer.uint32(/* id 11, wireType 0 =*/88).int32(message.qty);
                if (message.orderType != null && Object.hasOwnProperty.call(message, "orderType"))
                    writer.uint32(/* id 12, wireType 0 =*/96).int32(message.orderType);
                if (message.limitPrice != null && Object.hasOwnProperty.call(message, "limitPrice"))
                    writer.uint32(/* id 13, wireType 0 =*/104).int64(message.limitPrice);
                if (message.stopPrice != null && Object.hasOwnProperty.call(message, "stopPrice"))
                    writer.uint32(/* id 14, wireType 0 =*/112).int64(message.stopPrice);
                if (message.bracketId != null && Object.hasOwnProperty.call(message, "bracketId"))
                    writer.uint32(/* id 15, wireType 2 =*/122).string(message.bracketId);
                if (message.bracketType != null && Object.hasOwnProperty.call(message, "bracketType"))
                    writer.uint32(/* id 16, wireType 0 =*/128).int32(message.bracketType);
                return writer;
            };

            /**
             * Encodes the specified OrderUpdate message, length delimited. Does not implicitly {@link alg.live.OrderUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {alg.live.IOrderUpdate} message OrderUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OrderUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an OrderUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.OrderUpdate} OrderUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OrderUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.OrderUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.requestId = reader.string();
                            break;
                        }
                    case 2: {
                            message.clientOrderId = reader.string();
                            break;
                        }
                    case 3: {
                            message.exchangeOrderId = reader.string();
                            break;
                        }
                    case 4: {
                            message.status = reader.int32();
                            break;
                        }
                    case 5: {
                            message.filledQty = reader.int32();
                            break;
                        }
                    case 6: {
                            message.avgFillPrice = reader.int64();
                            break;
                        }
                    case 7: {
                            message.rejectReason = reader.string();
                            break;
                        }
                    case 8: {
                            message.timestamp = reader.int64();
                            break;
                        }
                    case 9: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 10: {
                            message.side = reader.int32();
                            break;
                        }
                    case 11: {
                            message.qty = reader.int32();
                            break;
                        }
                    case 12: {
                            message.orderType = reader.int32();
                            break;
                        }
                    case 13: {
                            message.limitPrice = reader.int64();
                            break;
                        }
                    case 14: {
                            message.stopPrice = reader.int64();
                            break;
                        }
                    case 15: {
                            message.bracketId = reader.string();
                            break;
                        }
                    case 16: {
                            message.bracketType = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an OrderUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.OrderUpdate} OrderUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OrderUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an OrderUpdate message.
             * @function verify
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            OrderUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    if (!$util.isString(message.requestId))
                        return "requestId: string expected";
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    if (!$util.isString(message.clientOrderId))
                        return "clientOrderId: string expected";
                if (message.exchangeOrderId != null && message.hasOwnProperty("exchangeOrderId"))
                    if (!$util.isString(message.exchangeOrderId))
                        return "exchangeOrderId: string expected";
                if (message.status != null && message.hasOwnProperty("status"))
                    switch (message.status) {
                    default:
                        return "status: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        break;
                    }
                if (message.filledQty != null && message.hasOwnProperty("filledQty"))
                    if (!$util.isInteger(message.filledQty))
                        return "filledQty: integer expected";
                if (message.avgFillPrice != null && message.hasOwnProperty("avgFillPrice")) {
                    properties._avgFillPrice = 1;
                    if (!$util.isInteger(message.avgFillPrice) && !(message.avgFillPrice && $util.isInteger(message.avgFillPrice.low) && $util.isInteger(message.avgFillPrice.high)))
                        return "avgFillPrice: integer|Long expected";
                }
                if (message.rejectReason != null && message.hasOwnProperty("rejectReason")) {
                    properties._rejectReason = 1;
                    if (!$util.isString(message.rejectReason))
                        return "rejectReason: string expected";
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.side != null && message.hasOwnProperty("side"))
                    switch (message.side) {
                    default:
                        return "side: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.qty != null && message.hasOwnProperty("qty"))
                    if (!$util.isInteger(message.qty))
                        return "qty: integer expected";
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    switch (message.orderType) {
                    default:
                        return "orderType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.limitPrice != null && message.hasOwnProperty("limitPrice")) {
                    properties._limitPrice = 1;
                    if (!$util.isInteger(message.limitPrice) && !(message.limitPrice && $util.isInteger(message.limitPrice.low) && $util.isInteger(message.limitPrice.high)))
                        return "limitPrice: integer|Long expected";
                }
                if (message.stopPrice != null && message.hasOwnProperty("stopPrice")) {
                    properties._stopPrice = 1;
                    if (!$util.isInteger(message.stopPrice) && !(message.stopPrice && $util.isInteger(message.stopPrice.low) && $util.isInteger(message.stopPrice.high)))
                        return "stopPrice: integer|Long expected";
                }
                if (message.bracketId != null && message.hasOwnProperty("bracketId")) {
                    properties._bracketId = 1;
                    if (!$util.isString(message.bracketId))
                        return "bracketId: string expected";
                }
                if (message.bracketType != null && message.hasOwnProperty("bracketType")) {
                    properties._bracketType = 1;
                    switch (message.bracketType) {
                    default:
                        return "bracketType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                }
                return null;
            };

            /**
             * Creates an OrderUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.OrderUpdate} OrderUpdate
             */
            OrderUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.OrderUpdate)
                    return object;
                let message = new $root.alg.live.OrderUpdate();
                if (object.requestId != null)
                    message.requestId = String(object.requestId);
                if (object.clientOrderId != null)
                    message.clientOrderId = String(object.clientOrderId);
                if (object.exchangeOrderId != null)
                    message.exchangeOrderId = String(object.exchangeOrderId);
                switch (object.status) {
                default:
                    if (typeof object.status === "number") {
                        message.status = object.status;
                        break;
                    }
                    break;
                case "ORDER_STATUS_UNKNOWN":
                case 0:
                    message.status = 0;
                    break;
                case "PENDING":
                case 1:
                    message.status = 1;
                    break;
                case "ACCEPTED":
                case 2:
                    message.status = 2;
                    break;
                case "WORKING":
                case 3:
                    message.status = 3;
                    break;
                case "PARTIAL_FILL":
                case 4:
                    message.status = 4;
                    break;
                case "FILLED":
                case 5:
                    message.status = 5;
                    break;
                case "CANCELLED":
                case 6:
                    message.status = 6;
                    break;
                case "REJECTED":
                case 7:
                    message.status = 7;
                    break;
                }
                if (object.filledQty != null)
                    message.filledQty = object.filledQty | 0;
                if (object.avgFillPrice != null)
                    if ($util.Long)
                        (message.avgFillPrice = $util.Long.fromValue(object.avgFillPrice)).unsigned = false;
                    else if (typeof object.avgFillPrice === "string")
                        message.avgFillPrice = parseInt(object.avgFillPrice, 10);
                    else if (typeof object.avgFillPrice === "number")
                        message.avgFillPrice = object.avgFillPrice;
                    else if (typeof object.avgFillPrice === "object")
                        message.avgFillPrice = new $util.LongBits(object.avgFillPrice.low >>> 0, object.avgFillPrice.high >>> 0).toNumber();
                if (object.rejectReason != null)
                    message.rejectReason = String(object.rejectReason);
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = false;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.side) {
                default:
                    if (typeof object.side === "number") {
                        message.side = object.side;
                        break;
                    }
                    break;
                case "SIDE_UNKNOWN":
                case 0:
                    message.side = 0;
                    break;
                case "BUY":
                case 1:
                    message.side = 1;
                    break;
                case "SELL":
                case 2:
                    message.side = 2;
                    break;
                }
                if (object.qty != null)
                    message.qty = object.qty | 0;
                switch (object.orderType) {
                default:
                    if (typeof object.orderType === "number") {
                        message.orderType = object.orderType;
                        break;
                    }
                    break;
                case "ORDER_TYPE_UNKNOWN":
                case 0:
                    message.orderType = 0;
                    break;
                case "MARKET":
                case 1:
                    message.orderType = 1;
                    break;
                case "LIMIT":
                case 2:
                    message.orderType = 2;
                    break;
                case "STOP":
                case 3:
                    message.orderType = 3;
                    break;
                case "STOP_LIMIT":
                case 4:
                    message.orderType = 4;
                    break;
                }
                if (object.limitPrice != null)
                    if ($util.Long)
                        (message.limitPrice = $util.Long.fromValue(object.limitPrice)).unsigned = false;
                    else if (typeof object.limitPrice === "string")
                        message.limitPrice = parseInt(object.limitPrice, 10);
                    else if (typeof object.limitPrice === "number")
                        message.limitPrice = object.limitPrice;
                    else if (typeof object.limitPrice === "object")
                        message.limitPrice = new $util.LongBits(object.limitPrice.low >>> 0, object.limitPrice.high >>> 0).toNumber();
                if (object.stopPrice != null)
                    if ($util.Long)
                        (message.stopPrice = $util.Long.fromValue(object.stopPrice)).unsigned = false;
                    else if (typeof object.stopPrice === "string")
                        message.stopPrice = parseInt(object.stopPrice, 10);
                    else if (typeof object.stopPrice === "number")
                        message.stopPrice = object.stopPrice;
                    else if (typeof object.stopPrice === "object")
                        message.stopPrice = new $util.LongBits(object.stopPrice.low >>> 0, object.stopPrice.high >>> 0).toNumber();
                if (object.bracketId != null)
                    message.bracketId = String(object.bracketId);
                switch (object.bracketType) {
                default:
                    if (typeof object.bracketType === "number") {
                        message.bracketType = object.bracketType;
                        break;
                    }
                    break;
                case "BRACKET_TYPE_UNKNOWN":
                case 0:
                    message.bracketType = 0;
                    break;
                case "BRACKET_ENTRY":
                case 1:
                    message.bracketType = 1;
                    break;
                case "BRACKET_TAKE_PROFIT":
                case 2:
                    message.bracketType = 2;
                    break;
                case "BRACKET_STOP_LOSS":
                case 3:
                    message.bracketType = 3;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from an OrderUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {alg.live.OrderUpdate} message OrderUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OrderUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.requestId = "";
                    object.clientOrderId = "";
                    object.exchangeOrderId = "";
                    object.status = options.enums === String ? "ORDER_STATUS_UNKNOWN" : 0;
                    object.filledQty = 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                    object.symbol = "";
                    object.side = options.enums === String ? "SIDE_UNKNOWN" : 0;
                    object.qty = 0;
                    object.orderType = options.enums === String ? "ORDER_TYPE_UNKNOWN" : 0;
                }
                if (message.requestId != null && message.hasOwnProperty("requestId"))
                    object.requestId = message.requestId;
                if (message.clientOrderId != null && message.hasOwnProperty("clientOrderId"))
                    object.clientOrderId = message.clientOrderId;
                if (message.exchangeOrderId != null && message.hasOwnProperty("exchangeOrderId"))
                    object.exchangeOrderId = message.exchangeOrderId;
                if (message.status != null && message.hasOwnProperty("status"))
                    object.status = options.enums === String ? $root.alg.live.OrderStatus[message.status] === undefined ? message.status : $root.alg.live.OrderStatus[message.status] : message.status;
                if (message.filledQty != null && message.hasOwnProperty("filledQty"))
                    object.filledQty = message.filledQty;
                if (message.avgFillPrice != null && message.hasOwnProperty("avgFillPrice")) {
                    if (typeof message.avgFillPrice === "number")
                        object.avgFillPrice = options.longs === String ? String(message.avgFillPrice) : message.avgFillPrice;
                    else
                        object.avgFillPrice = options.longs === String ? $util.Long.prototype.toString.call(message.avgFillPrice) : options.longs === Number ? new $util.LongBits(message.avgFillPrice.low >>> 0, message.avgFillPrice.high >>> 0).toNumber() : message.avgFillPrice;
                    if (options.oneofs)
                        object._avgFillPrice = "avgFillPrice";
                }
                if (message.rejectReason != null && message.hasOwnProperty("rejectReason")) {
                    object.rejectReason = message.rejectReason;
                    if (options.oneofs)
                        object._rejectReason = "rejectReason";
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.side != null && message.hasOwnProperty("side"))
                    object.side = options.enums === String ? $root.alg.live.Side[message.side] === undefined ? message.side : $root.alg.live.Side[message.side] : message.side;
                if (message.qty != null && message.hasOwnProperty("qty"))
                    object.qty = message.qty;
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    object.orderType = options.enums === String ? $root.alg.live.OrderType[message.orderType] === undefined ? message.orderType : $root.alg.live.OrderType[message.orderType] : message.orderType;
                if (message.limitPrice != null && message.hasOwnProperty("limitPrice")) {
                    if (typeof message.limitPrice === "number")
                        object.limitPrice = options.longs === String ? String(message.limitPrice) : message.limitPrice;
                    else
                        object.limitPrice = options.longs === String ? $util.Long.prototype.toString.call(message.limitPrice) : options.longs === Number ? new $util.LongBits(message.limitPrice.low >>> 0, message.limitPrice.high >>> 0).toNumber() : message.limitPrice;
                    if (options.oneofs)
                        object._limitPrice = "limitPrice";
                }
                if (message.stopPrice != null && message.hasOwnProperty("stopPrice")) {
                    if (typeof message.stopPrice === "number")
                        object.stopPrice = options.longs === String ? String(message.stopPrice) : message.stopPrice;
                    else
                        object.stopPrice = options.longs === String ? $util.Long.prototype.toString.call(message.stopPrice) : options.longs === Number ? new $util.LongBits(message.stopPrice.low >>> 0, message.stopPrice.high >>> 0).toNumber() : message.stopPrice;
                    if (options.oneofs)
                        object._stopPrice = "stopPrice";
                }
                if (message.bracketId != null && message.hasOwnProperty("bracketId")) {
                    object.bracketId = message.bracketId;
                    if (options.oneofs)
                        object._bracketId = "bracketId";
                }
                if (message.bracketType != null && message.hasOwnProperty("bracketType")) {
                    object.bracketType = options.enums === String ? $root.alg.live.BracketType[message.bracketType] === undefined ? message.bracketType : $root.alg.live.BracketType[message.bracketType] : message.bracketType;
                    if (options.oneofs)
                        object._bracketType = "bracketType";
                }
                return object;
            };

            /**
             * Converts this OrderUpdate to JSON.
             * @function toJSON
             * @memberof alg.live.OrderUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OrderUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for OrderUpdate
             * @function getTypeUrl
             * @memberof alg.live.OrderUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            OrderUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.OrderUpdate";
            };

            return OrderUpdate;
        })();

        live.CandleUpdate = (function() {

            /**
             * Properties of a CandleUpdate.
             * @memberof alg.live
             * @interface ICandleUpdate
             * @property {string|null} [symbol] CandleUpdate symbol
             * @property {alg.live.Timeframe|null} [timeframe] CandleUpdate timeframe
             * @property {number|Long|null} [ts] CandleUpdate ts
             * @property {number|Long|null} [open] CandleUpdate open
             * @property {number|Long|null} [high] CandleUpdate high
             * @property {number|Long|null} [low] CandleUpdate low
             * @property {number|Long|null} [close] CandleUpdate close
             * @property {number|Long|null} [volume] CandleUpdate volume
             * @property {boolean|null} [isClosed] CandleUpdate isClosed
             * @property {number|Long|null} [exchangeTs] CandleUpdate exchangeTs
             * @property {number|Long|null} [serverTs] CandleUpdate serverTs
             */

            /**
             * Constructs a new CandleUpdate.
             * @memberof alg.live
             * @classdesc Represents a CandleUpdate.
             * @implements ICandleUpdate
             * @constructor
             * @param {alg.live.ICandleUpdate=} [properties] Properties to set
             */
            function CandleUpdate(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CandleUpdate symbol.
             * @member {string} symbol
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.symbol = "";

            /**
             * CandleUpdate timeframe.
             * @member {alg.live.Timeframe} timeframe
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.timeframe = 0;

            /**
             * CandleUpdate ts.
             * @member {number|Long} ts
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * CandleUpdate open.
             * @member {number|Long} open
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.open = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * CandleUpdate high.
             * @member {number|Long} high
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.high = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * CandleUpdate low.
             * @member {number|Long} low
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.low = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * CandleUpdate close.
             * @member {number|Long} close
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.close = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * CandleUpdate volume.
             * @member {number|Long} volume
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.volume = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * CandleUpdate isClosed.
             * @member {boolean} isClosed
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.isClosed = false;

            /**
             * CandleUpdate exchangeTs.
             * @member {number|Long|null|undefined} exchangeTs
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.exchangeTs = null;

            /**
             * CandleUpdate serverTs.
             * @member {number|Long|null|undefined} serverTs
             * @memberof alg.live.CandleUpdate
             * @instance
             */
            CandleUpdate.prototype.serverTs = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(CandleUpdate.prototype, "_exchangeTs", {
                get: $util.oneOfGetter($oneOfFields = ["exchangeTs"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(CandleUpdate.prototype, "_serverTs", {
                get: $util.oneOfGetter($oneOfFields = ["serverTs"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new CandleUpdate instance using the specified properties.
             * @function create
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {alg.live.ICandleUpdate=} [properties] Properties to set
             * @returns {alg.live.CandleUpdate} CandleUpdate instance
             */
            CandleUpdate.create = function create(properties) {
                return new CandleUpdate(properties);
            };

            /**
             * Encodes the specified CandleUpdate message. Does not implicitly {@link alg.live.CandleUpdate.verify|verify} messages.
             * @function encode
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {alg.live.ICandleUpdate} message CandleUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CandleUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.timeframe != null && Object.hasOwnProperty.call(message, "timeframe"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.timeframe);
                if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int64(message.ts);
                if (message.open != null && Object.hasOwnProperty.call(message, "open"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.open);
                if (message.high != null && Object.hasOwnProperty.call(message, "high"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.high);
                if (message.low != null && Object.hasOwnProperty.call(message, "low"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int64(message.low);
                if (message.close != null && Object.hasOwnProperty.call(message, "close"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int64(message.close);
                if (message.volume != null && Object.hasOwnProperty.call(message, "volume"))
                    writer.uint32(/* id 8, wireType 0 =*/64).uint64(message.volume);
                if (message.isClosed != null && Object.hasOwnProperty.call(message, "isClosed"))
                    writer.uint32(/* id 9, wireType 0 =*/72).bool(message.isClosed);
                if (message.exchangeTs != null && Object.hasOwnProperty.call(message, "exchangeTs"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int64(message.exchangeTs);
                if (message.serverTs != null && Object.hasOwnProperty.call(message, "serverTs"))
                    writer.uint32(/* id 11, wireType 0 =*/88).int64(message.serverTs);
                return writer;
            };

            /**
             * Encodes the specified CandleUpdate message, length delimited. Does not implicitly {@link alg.live.CandleUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {alg.live.ICandleUpdate} message CandleUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CandleUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CandleUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.CandleUpdate} CandleUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CandleUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.CandleUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.timeframe = reader.int32();
                            break;
                        }
                    case 3: {
                            message.ts = reader.int64();
                            break;
                        }
                    case 4: {
                            message.open = reader.int64();
                            break;
                        }
                    case 5: {
                            message.high = reader.int64();
                            break;
                        }
                    case 6: {
                            message.low = reader.int64();
                            break;
                        }
                    case 7: {
                            message.close = reader.int64();
                            break;
                        }
                    case 8: {
                            message.volume = reader.uint64();
                            break;
                        }
                    case 9: {
                            message.isClosed = reader.bool();
                            break;
                        }
                    case 10: {
                            message.exchangeTs = reader.int64();
                            break;
                        }
                    case 11: {
                            message.serverTs = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CandleUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.CandleUpdate} CandleUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CandleUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CandleUpdate message.
             * @function verify
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CandleUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    switch (message.timeframe) {
                    default:
                        return "timeframe: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        break;
                    }
                if (message.ts != null && message.hasOwnProperty("ts"))
                    if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                        return "ts: integer|Long expected";
                if (message.open != null && message.hasOwnProperty("open"))
                    if (!$util.isInteger(message.open) && !(message.open && $util.isInteger(message.open.low) && $util.isInteger(message.open.high)))
                        return "open: integer|Long expected";
                if (message.high != null && message.hasOwnProperty("high"))
                    if (!$util.isInteger(message.high) && !(message.high && $util.isInteger(message.high.low) && $util.isInteger(message.high.high)))
                        return "high: integer|Long expected";
                if (message.low != null && message.hasOwnProperty("low"))
                    if (!$util.isInteger(message.low) && !(message.low && $util.isInteger(message.low.low) && $util.isInteger(message.low.high)))
                        return "low: integer|Long expected";
                if (message.close != null && message.hasOwnProperty("close"))
                    if (!$util.isInteger(message.close) && !(message.close && $util.isInteger(message.close.low) && $util.isInteger(message.close.high)))
                        return "close: integer|Long expected";
                if (message.volume != null && message.hasOwnProperty("volume"))
                    if (!$util.isInteger(message.volume) && !(message.volume && $util.isInteger(message.volume.low) && $util.isInteger(message.volume.high)))
                        return "volume: integer|Long expected";
                if (message.isClosed != null && message.hasOwnProperty("isClosed"))
                    if (typeof message.isClosed !== "boolean")
                        return "isClosed: boolean expected";
                if (message.exchangeTs != null && message.hasOwnProperty("exchangeTs")) {
                    properties._exchangeTs = 1;
                    if (!$util.isInteger(message.exchangeTs) && !(message.exchangeTs && $util.isInteger(message.exchangeTs.low) && $util.isInteger(message.exchangeTs.high)))
                        return "exchangeTs: integer|Long expected";
                }
                if (message.serverTs != null && message.hasOwnProperty("serverTs")) {
                    properties._serverTs = 1;
                    if (!$util.isInteger(message.serverTs) && !(message.serverTs && $util.isInteger(message.serverTs.low) && $util.isInteger(message.serverTs.high)))
                        return "serverTs: integer|Long expected";
                }
                return null;
            };

            /**
             * Creates a CandleUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.CandleUpdate} CandleUpdate
             */
            CandleUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.CandleUpdate)
                    return object;
                let message = new $root.alg.live.CandleUpdate();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.timeframe) {
                default:
                    if (typeof object.timeframe === "number") {
                        message.timeframe = object.timeframe;
                        break;
                    }
                    break;
                case "TIMEFRAME_UNKNOWN":
                case 0:
                    message.timeframe = 0;
                    break;
                case "S1":
                case 1:
                    message.timeframe = 1;
                    break;
                case "S5":
                case 2:
                    message.timeframe = 2;
                    break;
                case "M1":
                case 3:
                    message.timeframe = 3;
                    break;
                case "M5":
                case 4:
                    message.timeframe = 4;
                    break;
                case "M15":
                case 5:
                    message.timeframe = 5;
                    break;
                case "H1":
                case 6:
                    message.timeframe = 6;
                    break;
                case "H4":
                case 7:
                    message.timeframe = 7;
                    break;
                case "D1":
                case 8:
                    message.timeframe = 8;
                    break;
                }
                if (object.ts != null)
                    if ($util.Long)
                        (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
                    else if (typeof object.ts === "string")
                        message.ts = parseInt(object.ts, 10);
                    else if (typeof object.ts === "number")
                        message.ts = object.ts;
                    else if (typeof object.ts === "object")
                        message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
                if (object.open != null)
                    if ($util.Long)
                        (message.open = $util.Long.fromValue(object.open)).unsigned = false;
                    else if (typeof object.open === "string")
                        message.open = parseInt(object.open, 10);
                    else if (typeof object.open === "number")
                        message.open = object.open;
                    else if (typeof object.open === "object")
                        message.open = new $util.LongBits(object.open.low >>> 0, object.open.high >>> 0).toNumber();
                if (object.high != null)
                    if ($util.Long)
                        (message.high = $util.Long.fromValue(object.high)).unsigned = false;
                    else if (typeof object.high === "string")
                        message.high = parseInt(object.high, 10);
                    else if (typeof object.high === "number")
                        message.high = object.high;
                    else if (typeof object.high === "object")
                        message.high = new $util.LongBits(object.high.low >>> 0, object.high.high >>> 0).toNumber();
                if (object.low != null)
                    if ($util.Long)
                        (message.low = $util.Long.fromValue(object.low)).unsigned = false;
                    else if (typeof object.low === "string")
                        message.low = parseInt(object.low, 10);
                    else if (typeof object.low === "number")
                        message.low = object.low;
                    else if (typeof object.low === "object")
                        message.low = new $util.LongBits(object.low.low >>> 0, object.low.high >>> 0).toNumber();
                if (object.close != null)
                    if ($util.Long)
                        (message.close = $util.Long.fromValue(object.close)).unsigned = false;
                    else if (typeof object.close === "string")
                        message.close = parseInt(object.close, 10);
                    else if (typeof object.close === "number")
                        message.close = object.close;
                    else if (typeof object.close === "object")
                        message.close = new $util.LongBits(object.close.low >>> 0, object.close.high >>> 0).toNumber();
                if (object.volume != null)
                    if ($util.Long)
                        (message.volume = $util.Long.fromValue(object.volume)).unsigned = true;
                    else if (typeof object.volume === "string")
                        message.volume = parseInt(object.volume, 10);
                    else if (typeof object.volume === "number")
                        message.volume = object.volume;
                    else if (typeof object.volume === "object")
                        message.volume = new $util.LongBits(object.volume.low >>> 0, object.volume.high >>> 0).toNumber(true);
                if (object.isClosed != null)
                    message.isClosed = Boolean(object.isClosed);
                if (object.exchangeTs != null)
                    if ($util.Long)
                        (message.exchangeTs = $util.Long.fromValue(object.exchangeTs)).unsigned = false;
                    else if (typeof object.exchangeTs === "string")
                        message.exchangeTs = parseInt(object.exchangeTs, 10);
                    else if (typeof object.exchangeTs === "number")
                        message.exchangeTs = object.exchangeTs;
                    else if (typeof object.exchangeTs === "object")
                        message.exchangeTs = new $util.LongBits(object.exchangeTs.low >>> 0, object.exchangeTs.high >>> 0).toNumber();
                if (object.serverTs != null)
                    if ($util.Long)
                        (message.serverTs = $util.Long.fromValue(object.serverTs)).unsigned = false;
                    else if (typeof object.serverTs === "string")
                        message.serverTs = parseInt(object.serverTs, 10);
                    else if (typeof object.serverTs === "number")
                        message.serverTs = object.serverTs;
                    else if (typeof object.serverTs === "object")
                        message.serverTs = new $util.LongBits(object.serverTs.low >>> 0, object.serverTs.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a CandleUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {alg.live.CandleUpdate} message CandleUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CandleUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    object.timeframe = options.enums === String ? "TIMEFRAME_UNKNOWN" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.ts = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.open = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.open = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.high = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.high = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.low = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.low = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.close = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.close = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.volume = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.volume = options.longs === String ? "0" : 0;
                    object.isClosed = false;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    object.timeframe = options.enums === String ? $root.alg.live.Timeframe[message.timeframe] === undefined ? message.timeframe : $root.alg.live.Timeframe[message.timeframe] : message.timeframe;
                if (message.ts != null && message.hasOwnProperty("ts"))
                    if (typeof message.ts === "number")
                        object.ts = options.longs === String ? String(message.ts) : message.ts;
                    else
                        object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
                if (message.open != null && message.hasOwnProperty("open"))
                    if (typeof message.open === "number")
                        object.open = options.longs === String ? String(message.open) : message.open;
                    else
                        object.open = options.longs === String ? $util.Long.prototype.toString.call(message.open) : options.longs === Number ? new $util.LongBits(message.open.low >>> 0, message.open.high >>> 0).toNumber() : message.open;
                if (message.high != null && message.hasOwnProperty("high"))
                    if (typeof message.high === "number")
                        object.high = options.longs === String ? String(message.high) : message.high;
                    else
                        object.high = options.longs === String ? $util.Long.prototype.toString.call(message.high) : options.longs === Number ? new $util.LongBits(message.high.low >>> 0, message.high.high >>> 0).toNumber() : message.high;
                if (message.low != null && message.hasOwnProperty("low"))
                    if (typeof message.low === "number")
                        object.low = options.longs === String ? String(message.low) : message.low;
                    else
                        object.low = options.longs === String ? $util.Long.prototype.toString.call(message.low) : options.longs === Number ? new $util.LongBits(message.low.low >>> 0, message.low.high >>> 0).toNumber() : message.low;
                if (message.close != null && message.hasOwnProperty("close"))
                    if (typeof message.close === "number")
                        object.close = options.longs === String ? String(message.close) : message.close;
                    else
                        object.close = options.longs === String ? $util.Long.prototype.toString.call(message.close) : options.longs === Number ? new $util.LongBits(message.close.low >>> 0, message.close.high >>> 0).toNumber() : message.close;
                if (message.volume != null && message.hasOwnProperty("volume"))
                    if (typeof message.volume === "number")
                        object.volume = options.longs === String ? String(message.volume) : message.volume;
                    else
                        object.volume = options.longs === String ? $util.Long.prototype.toString.call(message.volume) : options.longs === Number ? new $util.LongBits(message.volume.low >>> 0, message.volume.high >>> 0).toNumber(true) : message.volume;
                if (message.isClosed != null && message.hasOwnProperty("isClosed"))
                    object.isClosed = message.isClosed;
                if (message.exchangeTs != null && message.hasOwnProperty("exchangeTs")) {
                    if (typeof message.exchangeTs === "number")
                        object.exchangeTs = options.longs === String ? String(message.exchangeTs) : message.exchangeTs;
                    else
                        object.exchangeTs = options.longs === String ? $util.Long.prototype.toString.call(message.exchangeTs) : options.longs === Number ? new $util.LongBits(message.exchangeTs.low >>> 0, message.exchangeTs.high >>> 0).toNumber() : message.exchangeTs;
                    if (options.oneofs)
                        object._exchangeTs = "exchangeTs";
                }
                if (message.serverTs != null && message.hasOwnProperty("serverTs")) {
                    if (typeof message.serverTs === "number")
                        object.serverTs = options.longs === String ? String(message.serverTs) : message.serverTs;
                    else
                        object.serverTs = options.longs === String ? $util.Long.prototype.toString.call(message.serverTs) : options.longs === Number ? new $util.LongBits(message.serverTs.low >>> 0, message.serverTs.high >>> 0).toNumber() : message.serverTs;
                    if (options.oneofs)
                        object._serverTs = "serverTs";
                }
                return object;
            };

            /**
             * Converts this CandleUpdate to JSON.
             * @function toJSON
             * @memberof alg.live.CandleUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CandleUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for CandleUpdate
             * @function getTypeUrl
             * @memberof alg.live.CandleUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            CandleUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.CandleUpdate";
            };

            return CandleUpdate;
        })();

        live.HistoricalCandles = (function() {

            /**
             * Properties of a HistoricalCandles.
             * @memberof alg.live
             * @interface IHistoricalCandles
             * @property {string|null} [symbol] HistoricalCandles symbol
             * @property {alg.live.Timeframe|null} [timeframe] HistoricalCandles timeframe
             * @property {Array.<alg.live.ICandleUpdate>|null} [candles] HistoricalCandles candles
             */

            /**
             * Constructs a new HistoricalCandles.
             * @memberof alg.live
             * @classdesc Represents a HistoricalCandles.
             * @implements IHistoricalCandles
             * @constructor
             * @param {alg.live.IHistoricalCandles=} [properties] Properties to set
             */
            function HistoricalCandles(properties) {
                this.candles = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HistoricalCandles symbol.
             * @member {string} symbol
             * @memberof alg.live.HistoricalCandles
             * @instance
             */
            HistoricalCandles.prototype.symbol = "";

            /**
             * HistoricalCandles timeframe.
             * @member {alg.live.Timeframe} timeframe
             * @memberof alg.live.HistoricalCandles
             * @instance
             */
            HistoricalCandles.prototype.timeframe = 0;

            /**
             * HistoricalCandles candles.
             * @member {Array.<alg.live.ICandleUpdate>} candles
             * @memberof alg.live.HistoricalCandles
             * @instance
             */
            HistoricalCandles.prototype.candles = $util.emptyArray;

            /**
             * Creates a new HistoricalCandles instance using the specified properties.
             * @function create
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {alg.live.IHistoricalCandles=} [properties] Properties to set
             * @returns {alg.live.HistoricalCandles} HistoricalCandles instance
             */
            HistoricalCandles.create = function create(properties) {
                return new HistoricalCandles(properties);
            };

            /**
             * Encodes the specified HistoricalCandles message. Does not implicitly {@link alg.live.HistoricalCandles.verify|verify} messages.
             * @function encode
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {alg.live.IHistoricalCandles} message HistoricalCandles message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HistoricalCandles.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.timeframe != null && Object.hasOwnProperty.call(message, "timeframe"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.timeframe);
                if (message.candles != null && message.candles.length)
                    for (let i = 0; i < message.candles.length; ++i)
                        $root.alg.live.CandleUpdate.encode(message.candles[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified HistoricalCandles message, length delimited. Does not implicitly {@link alg.live.HistoricalCandles.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {alg.live.IHistoricalCandles} message HistoricalCandles message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HistoricalCandles.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HistoricalCandles message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.HistoricalCandles} HistoricalCandles
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HistoricalCandles.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.HistoricalCandles();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.timeframe = reader.int32();
                            break;
                        }
                    case 3: {
                            if (!(message.candles && message.candles.length))
                                message.candles = [];
                            message.candles.push($root.alg.live.CandleUpdate.decode(reader, reader.uint32()));
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a HistoricalCandles message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.HistoricalCandles} HistoricalCandles
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HistoricalCandles.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HistoricalCandles message.
             * @function verify
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HistoricalCandles.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    switch (message.timeframe) {
                    default:
                        return "timeframe: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        break;
                    }
                if (message.candles != null && message.hasOwnProperty("candles")) {
                    if (!Array.isArray(message.candles))
                        return "candles: array expected";
                    for (let i = 0; i < message.candles.length; ++i) {
                        let error = $root.alg.live.CandleUpdate.verify(message.candles[i]);
                        if (error)
                            return "candles." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a HistoricalCandles message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.HistoricalCandles} HistoricalCandles
             */
            HistoricalCandles.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.HistoricalCandles)
                    return object;
                let message = new $root.alg.live.HistoricalCandles();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.timeframe) {
                default:
                    if (typeof object.timeframe === "number") {
                        message.timeframe = object.timeframe;
                        break;
                    }
                    break;
                case "TIMEFRAME_UNKNOWN":
                case 0:
                    message.timeframe = 0;
                    break;
                case "S1":
                case 1:
                    message.timeframe = 1;
                    break;
                case "S5":
                case 2:
                    message.timeframe = 2;
                    break;
                case "M1":
                case 3:
                    message.timeframe = 3;
                    break;
                case "M5":
                case 4:
                    message.timeframe = 4;
                    break;
                case "M15":
                case 5:
                    message.timeframe = 5;
                    break;
                case "H1":
                case 6:
                    message.timeframe = 6;
                    break;
                case "H4":
                case 7:
                    message.timeframe = 7;
                    break;
                case "D1":
                case 8:
                    message.timeframe = 8;
                    break;
                }
                if (object.candles) {
                    if (!Array.isArray(object.candles))
                        throw TypeError(".alg.live.HistoricalCandles.candles: array expected");
                    message.candles = [];
                    for (let i = 0; i < object.candles.length; ++i) {
                        if (typeof object.candles[i] !== "object")
                            throw TypeError(".alg.live.HistoricalCandles.candles: object expected");
                        message.candles[i] = $root.alg.live.CandleUpdate.fromObject(object.candles[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a HistoricalCandles message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {alg.live.HistoricalCandles} message HistoricalCandles
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HistoricalCandles.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.candles = [];
                if (options.defaults) {
                    object.symbol = "";
                    object.timeframe = options.enums === String ? "TIMEFRAME_UNKNOWN" : 0;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    object.timeframe = options.enums === String ? $root.alg.live.Timeframe[message.timeframe] === undefined ? message.timeframe : $root.alg.live.Timeframe[message.timeframe] : message.timeframe;
                if (message.candles && message.candles.length) {
                    object.candles = [];
                    for (let j = 0; j < message.candles.length; ++j)
                        object.candles[j] = $root.alg.live.CandleUpdate.toObject(message.candles[j], options);
                }
                return object;
            };

            /**
             * Converts this HistoricalCandles to JSON.
             * @function toJSON
             * @memberof alg.live.HistoricalCandles
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HistoricalCandles.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for HistoricalCandles
             * @function getTypeUrl
             * @memberof alg.live.HistoricalCandles
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            HistoricalCandles.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.HistoricalCandles";
            };

            return HistoricalCandles;
        })();

        live.TradeUpdate = (function() {

            /**
             * Properties of a TradeUpdate.
             * @memberof alg.live
             * @interface ITradeUpdate
             * @property {string|null} [symbol] TradeUpdate symbol
             * @property {number|Long|null} [price] TradeUpdate price
             * @property {number|null} [size] TradeUpdate size
             * @property {alg.live.Side|null} [aggressor] TradeUpdate aggressor
             * @property {number|Long|null} [exchangeTs] TradeUpdate exchangeTs
             * @property {number|Long|null} [serverTs] TradeUpdate serverTs
             * @property {number|Long|null} [totalVolume] TradeUpdate totalVolume
             * @property {number|Long|null} [netChange] TradeUpdate netChange
             * @property {number|Long|null} [percentChange] TradeUpdate percentChange
             * @property {number|Long|null} [vwap] TradeUpdate vwap
             * @property {boolean|null} [isSnapshot] TradeUpdate isSnapshot
             */

            /**
             * Constructs a new TradeUpdate.
             * @memberof alg.live
             * @classdesc Represents a TradeUpdate.
             * @implements ITradeUpdate
             * @constructor
             * @param {alg.live.ITradeUpdate=} [properties] Properties to set
             */
            function TradeUpdate(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TradeUpdate symbol.
             * @member {string} symbol
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.symbol = "";

            /**
             * TradeUpdate price.
             * @member {number|Long} price
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.price = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * TradeUpdate size.
             * @member {number} size
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.size = 0;

            /**
             * TradeUpdate aggressor.
             * @member {alg.live.Side} aggressor
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.aggressor = 0;

            /**
             * TradeUpdate exchangeTs.
             * @member {number|Long} exchangeTs
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.exchangeTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * TradeUpdate serverTs.
             * @member {number|Long} serverTs
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.serverTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * TradeUpdate totalVolume.
             * @member {number|Long|null|undefined} totalVolume
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.totalVolume = null;

            /**
             * TradeUpdate netChange.
             * @member {number|Long|null|undefined} netChange
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.netChange = null;

            /**
             * TradeUpdate percentChange.
             * @member {number|Long|null|undefined} percentChange
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.percentChange = null;

            /**
             * TradeUpdate vwap.
             * @member {number|Long|null|undefined} vwap
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.vwap = null;

            /**
             * TradeUpdate isSnapshot.
             * @member {boolean} isSnapshot
             * @memberof alg.live.TradeUpdate
             * @instance
             */
            TradeUpdate.prototype.isSnapshot = false;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(TradeUpdate.prototype, "_totalVolume", {
                get: $util.oneOfGetter($oneOfFields = ["totalVolume"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(TradeUpdate.prototype, "_netChange", {
                get: $util.oneOfGetter($oneOfFields = ["netChange"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(TradeUpdate.prototype, "_percentChange", {
                get: $util.oneOfGetter($oneOfFields = ["percentChange"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(TradeUpdate.prototype, "_vwap", {
                get: $util.oneOfGetter($oneOfFields = ["vwap"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new TradeUpdate instance using the specified properties.
             * @function create
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {alg.live.ITradeUpdate=} [properties] Properties to set
             * @returns {alg.live.TradeUpdate} TradeUpdate instance
             */
            TradeUpdate.create = function create(properties) {
                return new TradeUpdate(properties);
            };

            /**
             * Encodes the specified TradeUpdate message. Does not implicitly {@link alg.live.TradeUpdate.verify|verify} messages.
             * @function encode
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {alg.live.ITradeUpdate} message TradeUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TradeUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.price != null && Object.hasOwnProperty.call(message, "price"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int64(message.price);
                if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.size);
                if (message.aggressor != null && Object.hasOwnProperty.call(message, "aggressor"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.aggressor);
                if (message.exchangeTs != null && Object.hasOwnProperty.call(message, "exchangeTs"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.exchangeTs);
                if (message.serverTs != null && Object.hasOwnProperty.call(message, "serverTs"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int64(message.serverTs);
                if (message.totalVolume != null && Object.hasOwnProperty.call(message, "totalVolume"))
                    writer.uint32(/* id 7, wireType 0 =*/56).uint64(message.totalVolume);
                if (message.netChange != null && Object.hasOwnProperty.call(message, "netChange"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.netChange);
                if (message.percentChange != null && Object.hasOwnProperty.call(message, "percentChange"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int64(message.percentChange);
                if (message.vwap != null && Object.hasOwnProperty.call(message, "vwap"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int64(message.vwap);
                if (message.isSnapshot != null && Object.hasOwnProperty.call(message, "isSnapshot"))
                    writer.uint32(/* id 11, wireType 0 =*/88).bool(message.isSnapshot);
                return writer;
            };

            /**
             * Encodes the specified TradeUpdate message, length delimited. Does not implicitly {@link alg.live.TradeUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {alg.live.ITradeUpdate} message TradeUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TradeUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TradeUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.TradeUpdate} TradeUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TradeUpdate.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.TradeUpdate();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.price = reader.int64();
                            break;
                        }
                    case 3: {
                            message.size = reader.uint32();
                            break;
                        }
                    case 4: {
                            message.aggressor = reader.int32();
                            break;
                        }
                    case 5: {
                            message.exchangeTs = reader.int64();
                            break;
                        }
                    case 6: {
                            message.serverTs = reader.int64();
                            break;
                        }
                    case 7: {
                            message.totalVolume = reader.uint64();
                            break;
                        }
                    case 8: {
                            message.netChange = reader.int64();
                            break;
                        }
                    case 9: {
                            message.percentChange = reader.int64();
                            break;
                        }
                    case 10: {
                            message.vwap = reader.int64();
                            break;
                        }
                    case 11: {
                            message.isSnapshot = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TradeUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.TradeUpdate} TradeUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TradeUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TradeUpdate message.
             * @function verify
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TradeUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.price != null && message.hasOwnProperty("price"))
                    if (!$util.isInteger(message.price) && !(message.price && $util.isInteger(message.price.low) && $util.isInteger(message.price.high)))
                        return "price: integer|Long expected";
                if (message.size != null && message.hasOwnProperty("size"))
                    if (!$util.isInteger(message.size))
                        return "size: integer expected";
                if (message.aggressor != null && message.hasOwnProperty("aggressor"))
                    switch (message.aggressor) {
                    default:
                        return "aggressor: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.exchangeTs != null && message.hasOwnProperty("exchangeTs"))
                    if (!$util.isInteger(message.exchangeTs) && !(message.exchangeTs && $util.isInteger(message.exchangeTs.low) && $util.isInteger(message.exchangeTs.high)))
                        return "exchangeTs: integer|Long expected";
                if (message.serverTs != null && message.hasOwnProperty("serverTs"))
                    if (!$util.isInteger(message.serverTs) && !(message.serverTs && $util.isInteger(message.serverTs.low) && $util.isInteger(message.serverTs.high)))
                        return "serverTs: integer|Long expected";
                if (message.totalVolume != null && message.hasOwnProperty("totalVolume")) {
                    properties._totalVolume = 1;
                    if (!$util.isInteger(message.totalVolume) && !(message.totalVolume && $util.isInteger(message.totalVolume.low) && $util.isInteger(message.totalVolume.high)))
                        return "totalVolume: integer|Long expected";
                }
                if (message.netChange != null && message.hasOwnProperty("netChange")) {
                    properties._netChange = 1;
                    if (!$util.isInteger(message.netChange) && !(message.netChange && $util.isInteger(message.netChange.low) && $util.isInteger(message.netChange.high)))
                        return "netChange: integer|Long expected";
                }
                if (message.percentChange != null && message.hasOwnProperty("percentChange")) {
                    properties._percentChange = 1;
                    if (!$util.isInteger(message.percentChange) && !(message.percentChange && $util.isInteger(message.percentChange.low) && $util.isInteger(message.percentChange.high)))
                        return "percentChange: integer|Long expected";
                }
                if (message.vwap != null && message.hasOwnProperty("vwap")) {
                    properties._vwap = 1;
                    if (!$util.isInteger(message.vwap) && !(message.vwap && $util.isInteger(message.vwap.low) && $util.isInteger(message.vwap.high)))
                        return "vwap: integer|Long expected";
                }
                if (message.isSnapshot != null && message.hasOwnProperty("isSnapshot"))
                    if (typeof message.isSnapshot !== "boolean")
                        return "isSnapshot: boolean expected";
                return null;
            };

            /**
             * Creates a TradeUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.TradeUpdate} TradeUpdate
             */
            TradeUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.TradeUpdate)
                    return object;
                let message = new $root.alg.live.TradeUpdate();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                if (object.price != null)
                    if ($util.Long)
                        (message.price = $util.Long.fromValue(object.price)).unsigned = false;
                    else if (typeof object.price === "string")
                        message.price = parseInt(object.price, 10);
                    else if (typeof object.price === "number")
                        message.price = object.price;
                    else if (typeof object.price === "object")
                        message.price = new $util.LongBits(object.price.low >>> 0, object.price.high >>> 0).toNumber();
                if (object.size != null)
                    message.size = object.size >>> 0;
                switch (object.aggressor) {
                default:
                    if (typeof object.aggressor === "number") {
                        message.aggressor = object.aggressor;
                        break;
                    }
                    break;
                case "SIDE_UNKNOWN":
                case 0:
                    message.aggressor = 0;
                    break;
                case "BUY":
                case 1:
                    message.aggressor = 1;
                    break;
                case "SELL":
                case 2:
                    message.aggressor = 2;
                    break;
                }
                if (object.exchangeTs != null)
                    if ($util.Long)
                        (message.exchangeTs = $util.Long.fromValue(object.exchangeTs)).unsigned = false;
                    else if (typeof object.exchangeTs === "string")
                        message.exchangeTs = parseInt(object.exchangeTs, 10);
                    else if (typeof object.exchangeTs === "number")
                        message.exchangeTs = object.exchangeTs;
                    else if (typeof object.exchangeTs === "object")
                        message.exchangeTs = new $util.LongBits(object.exchangeTs.low >>> 0, object.exchangeTs.high >>> 0).toNumber();
                if (object.serverTs != null)
                    if ($util.Long)
                        (message.serverTs = $util.Long.fromValue(object.serverTs)).unsigned = false;
                    else if (typeof object.serverTs === "string")
                        message.serverTs = parseInt(object.serverTs, 10);
                    else if (typeof object.serverTs === "number")
                        message.serverTs = object.serverTs;
                    else if (typeof object.serverTs === "object")
                        message.serverTs = new $util.LongBits(object.serverTs.low >>> 0, object.serverTs.high >>> 0).toNumber();
                if (object.totalVolume != null)
                    if ($util.Long)
                        (message.totalVolume = $util.Long.fromValue(object.totalVolume)).unsigned = true;
                    else if (typeof object.totalVolume === "string")
                        message.totalVolume = parseInt(object.totalVolume, 10);
                    else if (typeof object.totalVolume === "number")
                        message.totalVolume = object.totalVolume;
                    else if (typeof object.totalVolume === "object")
                        message.totalVolume = new $util.LongBits(object.totalVolume.low >>> 0, object.totalVolume.high >>> 0).toNumber(true);
                if (object.netChange != null)
                    if ($util.Long)
                        (message.netChange = $util.Long.fromValue(object.netChange)).unsigned = false;
                    else if (typeof object.netChange === "string")
                        message.netChange = parseInt(object.netChange, 10);
                    else if (typeof object.netChange === "number")
                        message.netChange = object.netChange;
                    else if (typeof object.netChange === "object")
                        message.netChange = new $util.LongBits(object.netChange.low >>> 0, object.netChange.high >>> 0).toNumber();
                if (object.percentChange != null)
                    if ($util.Long)
                        (message.percentChange = $util.Long.fromValue(object.percentChange)).unsigned = false;
                    else if (typeof object.percentChange === "string")
                        message.percentChange = parseInt(object.percentChange, 10);
                    else if (typeof object.percentChange === "number")
                        message.percentChange = object.percentChange;
                    else if (typeof object.percentChange === "object")
                        message.percentChange = new $util.LongBits(object.percentChange.low >>> 0, object.percentChange.high >>> 0).toNumber();
                if (object.vwap != null)
                    if ($util.Long)
                        (message.vwap = $util.Long.fromValue(object.vwap)).unsigned = false;
                    else if (typeof object.vwap === "string")
                        message.vwap = parseInt(object.vwap, 10);
                    else if (typeof object.vwap === "number")
                        message.vwap = object.vwap;
                    else if (typeof object.vwap === "object")
                        message.vwap = new $util.LongBits(object.vwap.low >>> 0, object.vwap.high >>> 0).toNumber();
                if (object.isSnapshot != null)
                    message.isSnapshot = Boolean(object.isSnapshot);
                return message;
            };

            /**
             * Creates a plain object from a TradeUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {alg.live.TradeUpdate} message TradeUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TradeUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.price = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.price = options.longs === String ? "0" : 0;
                    object.size = 0;
                    object.aggressor = options.enums === String ? "SIDE_UNKNOWN" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.exchangeTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.exchangeTs = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.serverTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.serverTs = options.longs === String ? "0" : 0;
                    object.isSnapshot = false;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.price != null && message.hasOwnProperty("price"))
                    if (typeof message.price === "number")
                        object.price = options.longs === String ? String(message.price) : message.price;
                    else
                        object.price = options.longs === String ? $util.Long.prototype.toString.call(message.price) : options.longs === Number ? new $util.LongBits(message.price.low >>> 0, message.price.high >>> 0).toNumber() : message.price;
                if (message.size != null && message.hasOwnProperty("size"))
                    object.size = message.size;
                if (message.aggressor != null && message.hasOwnProperty("aggressor"))
                    object.aggressor = options.enums === String ? $root.alg.live.Side[message.aggressor] === undefined ? message.aggressor : $root.alg.live.Side[message.aggressor] : message.aggressor;
                if (message.exchangeTs != null && message.hasOwnProperty("exchangeTs"))
                    if (typeof message.exchangeTs === "number")
                        object.exchangeTs = options.longs === String ? String(message.exchangeTs) : message.exchangeTs;
                    else
                        object.exchangeTs = options.longs === String ? $util.Long.prototype.toString.call(message.exchangeTs) : options.longs === Number ? new $util.LongBits(message.exchangeTs.low >>> 0, message.exchangeTs.high >>> 0).toNumber() : message.exchangeTs;
                if (message.serverTs != null && message.hasOwnProperty("serverTs"))
                    if (typeof message.serverTs === "number")
                        object.serverTs = options.longs === String ? String(message.serverTs) : message.serverTs;
                    else
                        object.serverTs = options.longs === String ? $util.Long.prototype.toString.call(message.serverTs) : options.longs === Number ? new $util.LongBits(message.serverTs.low >>> 0, message.serverTs.high >>> 0).toNumber() : message.serverTs;
                if (message.totalVolume != null && message.hasOwnProperty("totalVolume")) {
                    if (typeof message.totalVolume === "number")
                        object.totalVolume = options.longs === String ? String(message.totalVolume) : message.totalVolume;
                    else
                        object.totalVolume = options.longs === String ? $util.Long.prototype.toString.call(message.totalVolume) : options.longs === Number ? new $util.LongBits(message.totalVolume.low >>> 0, message.totalVolume.high >>> 0).toNumber(true) : message.totalVolume;
                    if (options.oneofs)
                        object._totalVolume = "totalVolume";
                }
                if (message.netChange != null && message.hasOwnProperty("netChange")) {
                    if (typeof message.netChange === "number")
                        object.netChange = options.longs === String ? String(message.netChange) : message.netChange;
                    else
                        object.netChange = options.longs === String ? $util.Long.prototype.toString.call(message.netChange) : options.longs === Number ? new $util.LongBits(message.netChange.low >>> 0, message.netChange.high >>> 0).toNumber() : message.netChange;
                    if (options.oneofs)
                        object._netChange = "netChange";
                }
                if (message.percentChange != null && message.hasOwnProperty("percentChange")) {
                    if (typeof message.percentChange === "number")
                        object.percentChange = options.longs === String ? String(message.percentChange) : message.percentChange;
                    else
                        object.percentChange = options.longs === String ? $util.Long.prototype.toString.call(message.percentChange) : options.longs === Number ? new $util.LongBits(message.percentChange.low >>> 0, message.percentChange.high >>> 0).toNumber() : message.percentChange;
                    if (options.oneofs)
                        object._percentChange = "percentChange";
                }
                if (message.vwap != null && message.hasOwnProperty("vwap")) {
                    if (typeof message.vwap === "number")
                        object.vwap = options.longs === String ? String(message.vwap) : message.vwap;
                    else
                        object.vwap = options.longs === String ? $util.Long.prototype.toString.call(message.vwap) : options.longs === Number ? new $util.LongBits(message.vwap.low >>> 0, message.vwap.high >>> 0).toNumber() : message.vwap;
                    if (options.oneofs)
                        object._vwap = "vwap";
                }
                if (message.isSnapshot != null && message.hasOwnProperty("isSnapshot"))
                    object.isSnapshot = message.isSnapshot;
                return object;
            };

            /**
             * Converts this TradeUpdate to JSON.
             * @function toJSON
             * @memberof alg.live.TradeUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TradeUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for TradeUpdate
             * @function getTypeUrl
             * @memberof alg.live.TradeUpdate
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            TradeUpdate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.TradeUpdate";
            };

            return TradeUpdate;
        })();

        live.MarketStats = (function() {

            /**
             * Properties of a MarketStats.
             * @memberof alg.live
             * @interface IMarketStats
             * @property {string|null} [symbol] MarketStats symbol
             * @property {number|Long|null} [lastPrice] MarketStats lastPrice
             * @property {number|Long|null} [bid] MarketStats bid
             * @property {number|Long|null} [ask] MarketStats ask
             * @property {number|null} [bidSize] MarketStats bidSize
             * @property {number|null} [askSize] MarketStats askSize
             * @property {number|Long|null} [volume] MarketStats volume
             * @property {number|Long|null} [netChange] MarketStats netChange
             * @property {number|Long|null} [percentChange] MarketStats percentChange
             * @property {number|Long|null} [vwap] MarketStats vwap
             * @property {number|Long|null} [high] MarketStats high
             * @property {number|Long|null} [low] MarketStats low
             * @property {number|Long|null} [open] MarketStats open
             * @property {number|Long|null} [timestamp] MarketStats timestamp
             */

            /**
             * Constructs a new MarketStats.
             * @memberof alg.live
             * @classdesc Represents a MarketStats.
             * @implements IMarketStats
             * @constructor
             * @param {alg.live.IMarketStats=} [properties] Properties to set
             */
            function MarketStats(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MarketStats symbol.
             * @member {string} symbol
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.symbol = "";

            /**
             * MarketStats lastPrice.
             * @member {number|Long} lastPrice
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.lastPrice = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * MarketStats bid.
             * @member {number|Long|null|undefined} bid
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.bid = null;

            /**
             * MarketStats ask.
             * @member {number|Long|null|undefined} ask
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.ask = null;

            /**
             * MarketStats bidSize.
             * @member {number|null|undefined} bidSize
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.bidSize = null;

            /**
             * MarketStats askSize.
             * @member {number|null|undefined} askSize
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.askSize = null;

            /**
             * MarketStats volume.
             * @member {number|Long|null|undefined} volume
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.volume = null;

            /**
             * MarketStats netChange.
             * @member {number|Long|null|undefined} netChange
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.netChange = null;

            /**
             * MarketStats percentChange.
             * @member {number|Long|null|undefined} percentChange
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.percentChange = null;

            /**
             * MarketStats vwap.
             * @member {number|Long|null|undefined} vwap
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.vwap = null;

            /**
             * MarketStats high.
             * @member {number|Long|null|undefined} high
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.high = null;

            /**
             * MarketStats low.
             * @member {number|Long|null|undefined} low
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.low = null;

            /**
             * MarketStats open.
             * @member {number|Long|null|undefined} open
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.open = null;

            /**
             * MarketStats timestamp.
             * @member {number|Long} timestamp
             * @memberof alg.live.MarketStats
             * @instance
             */
            MarketStats.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_bid", {
                get: $util.oneOfGetter($oneOfFields = ["bid"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_ask", {
                get: $util.oneOfGetter($oneOfFields = ["ask"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_bidSize", {
                get: $util.oneOfGetter($oneOfFields = ["bidSize"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_askSize", {
                get: $util.oneOfGetter($oneOfFields = ["askSize"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_volume", {
                get: $util.oneOfGetter($oneOfFields = ["volume"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_netChange", {
                get: $util.oneOfGetter($oneOfFields = ["netChange"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_percentChange", {
                get: $util.oneOfGetter($oneOfFields = ["percentChange"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_vwap", {
                get: $util.oneOfGetter($oneOfFields = ["vwap"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_high", {
                get: $util.oneOfGetter($oneOfFields = ["high"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_low", {
                get: $util.oneOfGetter($oneOfFields = ["low"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(MarketStats.prototype, "_open", {
                get: $util.oneOfGetter($oneOfFields = ["open"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new MarketStats instance using the specified properties.
             * @function create
             * @memberof alg.live.MarketStats
             * @static
             * @param {alg.live.IMarketStats=} [properties] Properties to set
             * @returns {alg.live.MarketStats} MarketStats instance
             */
            MarketStats.create = function create(properties) {
                return new MarketStats(properties);
            };

            /**
             * Encodes the specified MarketStats message. Does not implicitly {@link alg.live.MarketStats.verify|verify} messages.
             * @function encode
             * @memberof alg.live.MarketStats
             * @static
             * @param {alg.live.IMarketStats} message MarketStats message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MarketStats.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.lastPrice != null && Object.hasOwnProperty.call(message, "lastPrice"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int64(message.lastPrice);
                if (message.bid != null && Object.hasOwnProperty.call(message, "bid"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int64(message.bid);
                if (message.ask != null && Object.hasOwnProperty.call(message, "ask"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.ask);
                if (message.bidSize != null && Object.hasOwnProperty.call(message, "bidSize"))
                    writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.bidSize);
                if (message.askSize != null && Object.hasOwnProperty.call(message, "askSize"))
                    writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.askSize);
                if (message.volume != null && Object.hasOwnProperty.call(message, "volume"))
                    writer.uint32(/* id 7, wireType 0 =*/56).uint64(message.volume);
                if (message.netChange != null && Object.hasOwnProperty.call(message, "netChange"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.netChange);
                if (message.percentChange != null && Object.hasOwnProperty.call(message, "percentChange"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int64(message.percentChange);
                if (message.vwap != null && Object.hasOwnProperty.call(message, "vwap"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int64(message.vwap);
                if (message.high != null && Object.hasOwnProperty.call(message, "high"))
                    writer.uint32(/* id 11, wireType 0 =*/88).int64(message.high);
                if (message.low != null && Object.hasOwnProperty.call(message, "low"))
                    writer.uint32(/* id 12, wireType 0 =*/96).int64(message.low);
                if (message.open != null && Object.hasOwnProperty.call(message, "open"))
                    writer.uint32(/* id 13, wireType 0 =*/104).int64(message.open);
                if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                    writer.uint32(/* id 14, wireType 0 =*/112).int64(message.timestamp);
                return writer;
            };

            /**
             * Encodes the specified MarketStats message, length delimited. Does not implicitly {@link alg.live.MarketStats.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.MarketStats
             * @static
             * @param {alg.live.IMarketStats} message MarketStats message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MarketStats.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MarketStats message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.MarketStats
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.MarketStats} MarketStats
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MarketStats.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.MarketStats();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.lastPrice = reader.int64();
                            break;
                        }
                    case 3: {
                            message.bid = reader.int64();
                            break;
                        }
                    case 4: {
                            message.ask = reader.int64();
                            break;
                        }
                    case 5: {
                            message.bidSize = reader.uint32();
                            break;
                        }
                    case 6: {
                            message.askSize = reader.uint32();
                            break;
                        }
                    case 7: {
                            message.volume = reader.uint64();
                            break;
                        }
                    case 8: {
                            message.netChange = reader.int64();
                            break;
                        }
                    case 9: {
                            message.percentChange = reader.int64();
                            break;
                        }
                    case 10: {
                            message.vwap = reader.int64();
                            break;
                        }
                    case 11: {
                            message.high = reader.int64();
                            break;
                        }
                    case 12: {
                            message.low = reader.int64();
                            break;
                        }
                    case 13: {
                            message.open = reader.int64();
                            break;
                        }
                    case 14: {
                            message.timestamp = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MarketStats message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.MarketStats
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.MarketStats} MarketStats
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MarketStats.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MarketStats message.
             * @function verify
             * @memberof alg.live.MarketStats
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MarketStats.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.lastPrice != null && message.hasOwnProperty("lastPrice"))
                    if (!$util.isInteger(message.lastPrice) && !(message.lastPrice && $util.isInteger(message.lastPrice.low) && $util.isInteger(message.lastPrice.high)))
                        return "lastPrice: integer|Long expected";
                if (message.bid != null && message.hasOwnProperty("bid")) {
                    properties._bid = 1;
                    if (!$util.isInteger(message.bid) && !(message.bid && $util.isInteger(message.bid.low) && $util.isInteger(message.bid.high)))
                        return "bid: integer|Long expected";
                }
                if (message.ask != null && message.hasOwnProperty("ask")) {
                    properties._ask = 1;
                    if (!$util.isInteger(message.ask) && !(message.ask && $util.isInteger(message.ask.low) && $util.isInteger(message.ask.high)))
                        return "ask: integer|Long expected";
                }
                if (message.bidSize != null && message.hasOwnProperty("bidSize")) {
                    properties._bidSize = 1;
                    if (!$util.isInteger(message.bidSize))
                        return "bidSize: integer expected";
                }
                if (message.askSize != null && message.hasOwnProperty("askSize")) {
                    properties._askSize = 1;
                    if (!$util.isInteger(message.askSize))
                        return "askSize: integer expected";
                }
                if (message.volume != null && message.hasOwnProperty("volume")) {
                    properties._volume = 1;
                    if (!$util.isInteger(message.volume) && !(message.volume && $util.isInteger(message.volume.low) && $util.isInteger(message.volume.high)))
                        return "volume: integer|Long expected";
                }
                if (message.netChange != null && message.hasOwnProperty("netChange")) {
                    properties._netChange = 1;
                    if (!$util.isInteger(message.netChange) && !(message.netChange && $util.isInteger(message.netChange.low) && $util.isInteger(message.netChange.high)))
                        return "netChange: integer|Long expected";
                }
                if (message.percentChange != null && message.hasOwnProperty("percentChange")) {
                    properties._percentChange = 1;
                    if (!$util.isInteger(message.percentChange) && !(message.percentChange && $util.isInteger(message.percentChange.low) && $util.isInteger(message.percentChange.high)))
                        return "percentChange: integer|Long expected";
                }
                if (message.vwap != null && message.hasOwnProperty("vwap")) {
                    properties._vwap = 1;
                    if (!$util.isInteger(message.vwap) && !(message.vwap && $util.isInteger(message.vwap.low) && $util.isInteger(message.vwap.high)))
                        return "vwap: integer|Long expected";
                }
                if (message.high != null && message.hasOwnProperty("high")) {
                    properties._high = 1;
                    if (!$util.isInteger(message.high) && !(message.high && $util.isInteger(message.high.low) && $util.isInteger(message.high.high)))
                        return "high: integer|Long expected";
                }
                if (message.low != null && message.hasOwnProperty("low")) {
                    properties._low = 1;
                    if (!$util.isInteger(message.low) && !(message.low && $util.isInteger(message.low.low) && $util.isInteger(message.low.high)))
                        return "low: integer|Long expected";
                }
                if (message.open != null && message.hasOwnProperty("open")) {
                    properties._open = 1;
                    if (!$util.isInteger(message.open) && !(message.open && $util.isInteger(message.open.low) && $util.isInteger(message.open.high)))
                        return "open: integer|Long expected";
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                return null;
            };

            /**
             * Creates a MarketStats message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.MarketStats
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.MarketStats} MarketStats
             */
            MarketStats.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.MarketStats)
                    return object;
                let message = new $root.alg.live.MarketStats();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                if (object.lastPrice != null)
                    if ($util.Long)
                        (message.lastPrice = $util.Long.fromValue(object.lastPrice)).unsigned = false;
                    else if (typeof object.lastPrice === "string")
                        message.lastPrice = parseInt(object.lastPrice, 10);
                    else if (typeof object.lastPrice === "number")
                        message.lastPrice = object.lastPrice;
                    else if (typeof object.lastPrice === "object")
                        message.lastPrice = new $util.LongBits(object.lastPrice.low >>> 0, object.lastPrice.high >>> 0).toNumber();
                if (object.bid != null)
                    if ($util.Long)
                        (message.bid = $util.Long.fromValue(object.bid)).unsigned = false;
                    else if (typeof object.bid === "string")
                        message.bid = parseInt(object.bid, 10);
                    else if (typeof object.bid === "number")
                        message.bid = object.bid;
                    else if (typeof object.bid === "object")
                        message.bid = new $util.LongBits(object.bid.low >>> 0, object.bid.high >>> 0).toNumber();
                if (object.ask != null)
                    if ($util.Long)
                        (message.ask = $util.Long.fromValue(object.ask)).unsigned = false;
                    else if (typeof object.ask === "string")
                        message.ask = parseInt(object.ask, 10);
                    else if (typeof object.ask === "number")
                        message.ask = object.ask;
                    else if (typeof object.ask === "object")
                        message.ask = new $util.LongBits(object.ask.low >>> 0, object.ask.high >>> 0).toNumber();
                if (object.bidSize != null)
                    message.bidSize = object.bidSize >>> 0;
                if (object.askSize != null)
                    message.askSize = object.askSize >>> 0;
                if (object.volume != null)
                    if ($util.Long)
                        (message.volume = $util.Long.fromValue(object.volume)).unsigned = true;
                    else if (typeof object.volume === "string")
                        message.volume = parseInt(object.volume, 10);
                    else if (typeof object.volume === "number")
                        message.volume = object.volume;
                    else if (typeof object.volume === "object")
                        message.volume = new $util.LongBits(object.volume.low >>> 0, object.volume.high >>> 0).toNumber(true);
                if (object.netChange != null)
                    if ($util.Long)
                        (message.netChange = $util.Long.fromValue(object.netChange)).unsigned = false;
                    else if (typeof object.netChange === "string")
                        message.netChange = parseInt(object.netChange, 10);
                    else if (typeof object.netChange === "number")
                        message.netChange = object.netChange;
                    else if (typeof object.netChange === "object")
                        message.netChange = new $util.LongBits(object.netChange.low >>> 0, object.netChange.high >>> 0).toNumber();
                if (object.percentChange != null)
                    if ($util.Long)
                        (message.percentChange = $util.Long.fromValue(object.percentChange)).unsigned = false;
                    else if (typeof object.percentChange === "string")
                        message.percentChange = parseInt(object.percentChange, 10);
                    else if (typeof object.percentChange === "number")
                        message.percentChange = object.percentChange;
                    else if (typeof object.percentChange === "object")
                        message.percentChange = new $util.LongBits(object.percentChange.low >>> 0, object.percentChange.high >>> 0).toNumber();
                if (object.vwap != null)
                    if ($util.Long)
                        (message.vwap = $util.Long.fromValue(object.vwap)).unsigned = false;
                    else if (typeof object.vwap === "string")
                        message.vwap = parseInt(object.vwap, 10);
                    else if (typeof object.vwap === "number")
                        message.vwap = object.vwap;
                    else if (typeof object.vwap === "object")
                        message.vwap = new $util.LongBits(object.vwap.low >>> 0, object.vwap.high >>> 0).toNumber();
                if (object.high != null)
                    if ($util.Long)
                        (message.high = $util.Long.fromValue(object.high)).unsigned = false;
                    else if (typeof object.high === "string")
                        message.high = parseInt(object.high, 10);
                    else if (typeof object.high === "number")
                        message.high = object.high;
                    else if (typeof object.high === "object")
                        message.high = new $util.LongBits(object.high.low >>> 0, object.high.high >>> 0).toNumber();
                if (object.low != null)
                    if ($util.Long)
                        (message.low = $util.Long.fromValue(object.low)).unsigned = false;
                    else if (typeof object.low === "string")
                        message.low = parseInt(object.low, 10);
                    else if (typeof object.low === "number")
                        message.low = object.low;
                    else if (typeof object.low === "object")
                        message.low = new $util.LongBits(object.low.low >>> 0, object.low.high >>> 0).toNumber();
                if (object.open != null)
                    if ($util.Long)
                        (message.open = $util.Long.fromValue(object.open)).unsigned = false;
                    else if (typeof object.open === "string")
                        message.open = parseInt(object.open, 10);
                    else if (typeof object.open === "number")
                        message.open = object.open;
                    else if (typeof object.open === "object")
                        message.open = new $util.LongBits(object.open.low >>> 0, object.open.high >>> 0).toNumber();
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = false;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a MarketStats message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.MarketStats
             * @static
             * @param {alg.live.MarketStats} message MarketStats
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MarketStats.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.lastPrice = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.lastPrice = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.lastPrice != null && message.hasOwnProperty("lastPrice"))
                    if (typeof message.lastPrice === "number")
                        object.lastPrice = options.longs === String ? String(message.lastPrice) : message.lastPrice;
                    else
                        object.lastPrice = options.longs === String ? $util.Long.prototype.toString.call(message.lastPrice) : options.longs === Number ? new $util.LongBits(message.lastPrice.low >>> 0, message.lastPrice.high >>> 0).toNumber() : message.lastPrice;
                if (message.bid != null && message.hasOwnProperty("bid")) {
                    if (typeof message.bid === "number")
                        object.bid = options.longs === String ? String(message.bid) : message.bid;
                    else
                        object.bid = options.longs === String ? $util.Long.prototype.toString.call(message.bid) : options.longs === Number ? new $util.LongBits(message.bid.low >>> 0, message.bid.high >>> 0).toNumber() : message.bid;
                    if (options.oneofs)
                        object._bid = "bid";
                }
                if (message.ask != null && message.hasOwnProperty("ask")) {
                    if (typeof message.ask === "number")
                        object.ask = options.longs === String ? String(message.ask) : message.ask;
                    else
                        object.ask = options.longs === String ? $util.Long.prototype.toString.call(message.ask) : options.longs === Number ? new $util.LongBits(message.ask.low >>> 0, message.ask.high >>> 0).toNumber() : message.ask;
                    if (options.oneofs)
                        object._ask = "ask";
                }
                if (message.bidSize != null && message.hasOwnProperty("bidSize")) {
                    object.bidSize = message.bidSize;
                    if (options.oneofs)
                        object._bidSize = "bidSize";
                }
                if (message.askSize != null && message.hasOwnProperty("askSize")) {
                    object.askSize = message.askSize;
                    if (options.oneofs)
                        object._askSize = "askSize";
                }
                if (message.volume != null && message.hasOwnProperty("volume")) {
                    if (typeof message.volume === "number")
                        object.volume = options.longs === String ? String(message.volume) : message.volume;
                    else
                        object.volume = options.longs === String ? $util.Long.prototype.toString.call(message.volume) : options.longs === Number ? new $util.LongBits(message.volume.low >>> 0, message.volume.high >>> 0).toNumber(true) : message.volume;
                    if (options.oneofs)
                        object._volume = "volume";
                }
                if (message.netChange != null && message.hasOwnProperty("netChange")) {
                    if (typeof message.netChange === "number")
                        object.netChange = options.longs === String ? String(message.netChange) : message.netChange;
                    else
                        object.netChange = options.longs === String ? $util.Long.prototype.toString.call(message.netChange) : options.longs === Number ? new $util.LongBits(message.netChange.low >>> 0, message.netChange.high >>> 0).toNumber() : message.netChange;
                    if (options.oneofs)
                        object._netChange = "netChange";
                }
                if (message.percentChange != null && message.hasOwnProperty("percentChange")) {
                    if (typeof message.percentChange === "number")
                        object.percentChange = options.longs === String ? String(message.percentChange) : message.percentChange;
                    else
                        object.percentChange = options.longs === String ? $util.Long.prototype.toString.call(message.percentChange) : options.longs === Number ? new $util.LongBits(message.percentChange.low >>> 0, message.percentChange.high >>> 0).toNumber() : message.percentChange;
                    if (options.oneofs)
                        object._percentChange = "percentChange";
                }
                if (message.vwap != null && message.hasOwnProperty("vwap")) {
                    if (typeof message.vwap === "number")
                        object.vwap = options.longs === String ? String(message.vwap) : message.vwap;
                    else
                        object.vwap = options.longs === String ? $util.Long.prototype.toString.call(message.vwap) : options.longs === Number ? new $util.LongBits(message.vwap.low >>> 0, message.vwap.high >>> 0).toNumber() : message.vwap;
                    if (options.oneofs)
                        object._vwap = "vwap";
                }
                if (message.high != null && message.hasOwnProperty("high")) {
                    if (typeof message.high === "number")
                        object.high = options.longs === String ? String(message.high) : message.high;
                    else
                        object.high = options.longs === String ? $util.Long.prototype.toString.call(message.high) : options.longs === Number ? new $util.LongBits(message.high.low >>> 0, message.high.high >>> 0).toNumber() : message.high;
                    if (options.oneofs)
                        object._high = "high";
                }
                if (message.low != null && message.hasOwnProperty("low")) {
                    if (typeof message.low === "number")
                        object.low = options.longs === String ? String(message.low) : message.low;
                    else
                        object.low = options.longs === String ? $util.Long.prototype.toString.call(message.low) : options.longs === Number ? new $util.LongBits(message.low.low >>> 0, message.low.high >>> 0).toNumber() : message.low;
                    if (options.oneofs)
                        object._low = "low";
                }
                if (message.open != null && message.hasOwnProperty("open")) {
                    if (typeof message.open === "number")
                        object.open = options.longs === String ? String(message.open) : message.open;
                    else
                        object.open = options.longs === String ? $util.Long.prototype.toString.call(message.open) : options.longs === Number ? new $util.LongBits(message.open.low >>> 0, message.open.high >>> 0).toNumber() : message.open;
                    if (options.oneofs)
                        object._open = "open";
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
                return object;
            };

            /**
             * Converts this MarketStats to JSON.
             * @function toJSON
             * @memberof alg.live.MarketStats
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MarketStats.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MarketStats
             * @function getTypeUrl
             * @memberof alg.live.MarketStats
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MarketStats.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.MarketStats";
            };

            return MarketStats;
        })();

        live.SymbolInfo = (function() {

            /**
             * Properties of a SymbolInfo.
             * @memberof alg.live
             * @interface ISymbolInfo
             * @property {string|null} [symbol] SymbolInfo symbol
             * @property {string|null} [exchange] SymbolInfo exchange
             * @property {string|null} [product] SymbolInfo product
             * @property {number|null} [tickSize] SymbolInfo tickSize
             * @property {number|null} [pointValue] SymbolInfo pointValue
             * @property {string|null} [expiration] SymbolInfo expiration
             */

            /**
             * Constructs a new SymbolInfo.
             * @memberof alg.live
             * @classdesc Represents a SymbolInfo.
             * @implements ISymbolInfo
             * @constructor
             * @param {alg.live.ISymbolInfo=} [properties] Properties to set
             */
            function SymbolInfo(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SymbolInfo symbol.
             * @member {string} symbol
             * @memberof alg.live.SymbolInfo
             * @instance
             */
            SymbolInfo.prototype.symbol = "";

            /**
             * SymbolInfo exchange.
             * @member {string} exchange
             * @memberof alg.live.SymbolInfo
             * @instance
             */
            SymbolInfo.prototype.exchange = "";

            /**
             * SymbolInfo product.
             * @member {string} product
             * @memberof alg.live.SymbolInfo
             * @instance
             */
            SymbolInfo.prototype.product = "";

            /**
             * SymbolInfo tickSize.
             * @member {number|null|undefined} tickSize
             * @memberof alg.live.SymbolInfo
             * @instance
             */
            SymbolInfo.prototype.tickSize = null;

            /**
             * SymbolInfo pointValue.
             * @member {number|null|undefined} pointValue
             * @memberof alg.live.SymbolInfo
             * @instance
             */
            SymbolInfo.prototype.pointValue = null;

            /**
             * SymbolInfo expiration.
             * @member {string|null|undefined} expiration
             * @memberof alg.live.SymbolInfo
             * @instance
             */
            SymbolInfo.prototype.expiration = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(SymbolInfo.prototype, "_tickSize", {
                get: $util.oneOfGetter($oneOfFields = ["tickSize"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(SymbolInfo.prototype, "_pointValue", {
                get: $util.oneOfGetter($oneOfFields = ["pointValue"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(SymbolInfo.prototype, "_expiration", {
                get: $util.oneOfGetter($oneOfFields = ["expiration"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new SymbolInfo instance using the specified properties.
             * @function create
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {alg.live.ISymbolInfo=} [properties] Properties to set
             * @returns {alg.live.SymbolInfo} SymbolInfo instance
             */
            SymbolInfo.create = function create(properties) {
                return new SymbolInfo(properties);
            };

            /**
             * Encodes the specified SymbolInfo message. Does not implicitly {@link alg.live.SymbolInfo.verify|verify} messages.
             * @function encode
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {alg.live.ISymbolInfo} message SymbolInfo message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SymbolInfo.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.exchange != null && Object.hasOwnProperty.call(message, "exchange"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.exchange);
                if (message.product != null && Object.hasOwnProperty.call(message, "product"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.product);
                if (message.tickSize != null && Object.hasOwnProperty.call(message, "tickSize"))
                    writer.uint32(/* id 4, wireType 1 =*/33).double(message.tickSize);
                if (message.pointValue != null && Object.hasOwnProperty.call(message, "pointValue"))
                    writer.uint32(/* id 5, wireType 1 =*/41).double(message.pointValue);
                if (message.expiration != null && Object.hasOwnProperty.call(message, "expiration"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.expiration);
                return writer;
            };

            /**
             * Encodes the specified SymbolInfo message, length delimited. Does not implicitly {@link alg.live.SymbolInfo.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {alg.live.ISymbolInfo} message SymbolInfo message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SymbolInfo.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SymbolInfo message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.SymbolInfo} SymbolInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SymbolInfo.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.SymbolInfo();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.exchange = reader.string();
                            break;
                        }
                    case 3: {
                            message.product = reader.string();
                            break;
                        }
                    case 4: {
                            message.tickSize = reader.double();
                            break;
                        }
                    case 5: {
                            message.pointValue = reader.double();
                            break;
                        }
                    case 6: {
                            message.expiration = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SymbolInfo message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.SymbolInfo} SymbolInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SymbolInfo.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SymbolInfo message.
             * @function verify
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SymbolInfo.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.exchange != null && message.hasOwnProperty("exchange"))
                    if (!$util.isString(message.exchange))
                        return "exchange: string expected";
                if (message.product != null && message.hasOwnProperty("product"))
                    if (!$util.isString(message.product))
                        return "product: string expected";
                if (message.tickSize != null && message.hasOwnProperty("tickSize")) {
                    properties._tickSize = 1;
                    if (typeof message.tickSize !== "number")
                        return "tickSize: number expected";
                }
                if (message.pointValue != null && message.hasOwnProperty("pointValue")) {
                    properties._pointValue = 1;
                    if (typeof message.pointValue !== "number")
                        return "pointValue: number expected";
                }
                if (message.expiration != null && message.hasOwnProperty("expiration")) {
                    properties._expiration = 1;
                    if (!$util.isString(message.expiration))
                        return "expiration: string expected";
                }
                return null;
            };

            /**
             * Creates a SymbolInfo message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.SymbolInfo} SymbolInfo
             */
            SymbolInfo.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.SymbolInfo)
                    return object;
                let message = new $root.alg.live.SymbolInfo();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                if (object.exchange != null)
                    message.exchange = String(object.exchange);
                if (object.product != null)
                    message.product = String(object.product);
                if (object.tickSize != null)
                    message.tickSize = Number(object.tickSize);
                if (object.pointValue != null)
                    message.pointValue = Number(object.pointValue);
                if (object.expiration != null)
                    message.expiration = String(object.expiration);
                return message;
            };

            /**
             * Creates a plain object from a SymbolInfo message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {alg.live.SymbolInfo} message SymbolInfo
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SymbolInfo.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    object.exchange = "";
                    object.product = "";
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.exchange != null && message.hasOwnProperty("exchange"))
                    object.exchange = message.exchange;
                if (message.product != null && message.hasOwnProperty("product"))
                    object.product = message.product;
                if (message.tickSize != null && message.hasOwnProperty("tickSize")) {
                    object.tickSize = options.json && !isFinite(message.tickSize) ? String(message.tickSize) : message.tickSize;
                    if (options.oneofs)
                        object._tickSize = "tickSize";
                }
                if (message.pointValue != null && message.hasOwnProperty("pointValue")) {
                    object.pointValue = options.json && !isFinite(message.pointValue) ? String(message.pointValue) : message.pointValue;
                    if (options.oneofs)
                        object._pointValue = "pointValue";
                }
                if (message.expiration != null && message.hasOwnProperty("expiration")) {
                    object.expiration = message.expiration;
                    if (options.oneofs)
                        object._expiration = "expiration";
                }
                return object;
            };

            /**
             * Converts this SymbolInfo to JSON.
             * @function toJSON
             * @memberof alg.live.SymbolInfo
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SymbolInfo.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SymbolInfo
             * @function getTypeUrl
             * @memberof alg.live.SymbolInfo
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SymbolInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.SymbolInfo";
            };

            return SymbolInfo;
        })();

        live.DepthLevel = (function() {

            /**
             * Properties of a DepthLevel.
             * @memberof alg.live
             * @interface IDepthLevel
             * @property {number|Long|null} [price] DepthLevel price
             * @property {number|null} [size] DepthLevel size
             * @property {number|null} [orders] DepthLevel orders
             */

            /**
             * Constructs a new DepthLevel.
             * @memberof alg.live
             * @classdesc Represents a DepthLevel.
             * @implements IDepthLevel
             * @constructor
             * @param {alg.live.IDepthLevel=} [properties] Properties to set
             */
            function DepthLevel(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DepthLevel price.
             * @member {number|Long} price
             * @memberof alg.live.DepthLevel
             * @instance
             */
            DepthLevel.prototype.price = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * DepthLevel size.
             * @member {number} size
             * @memberof alg.live.DepthLevel
             * @instance
             */
            DepthLevel.prototype.size = 0;

            /**
             * DepthLevel orders.
             * @member {number} orders
             * @memberof alg.live.DepthLevel
             * @instance
             */
            DepthLevel.prototype.orders = 0;

            /**
             * Creates a new DepthLevel instance using the specified properties.
             * @function create
             * @memberof alg.live.DepthLevel
             * @static
             * @param {alg.live.IDepthLevel=} [properties] Properties to set
             * @returns {alg.live.DepthLevel} DepthLevel instance
             */
            DepthLevel.create = function create(properties) {
                return new DepthLevel(properties);
            };

            /**
             * Encodes the specified DepthLevel message. Does not implicitly {@link alg.live.DepthLevel.verify|verify} messages.
             * @function encode
             * @memberof alg.live.DepthLevel
             * @static
             * @param {alg.live.IDepthLevel} message DepthLevel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DepthLevel.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.price != null && Object.hasOwnProperty.call(message, "price"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.price);
                if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.size);
                if (message.orders != null && Object.hasOwnProperty.call(message, "orders"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.orders);
                return writer;
            };

            /**
             * Encodes the specified DepthLevel message, length delimited. Does not implicitly {@link alg.live.DepthLevel.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.DepthLevel
             * @static
             * @param {alg.live.IDepthLevel} message DepthLevel message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DepthLevel.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DepthLevel message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.DepthLevel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.DepthLevel} DepthLevel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DepthLevel.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.DepthLevel();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.price = reader.int64();
                            break;
                        }
                    case 2: {
                            message.size = reader.uint32();
                            break;
                        }
                    case 3: {
                            message.orders = reader.uint32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a DepthLevel message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.DepthLevel
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.DepthLevel} DepthLevel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DepthLevel.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DepthLevel message.
             * @function verify
             * @memberof alg.live.DepthLevel
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DepthLevel.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.price != null && message.hasOwnProperty("price"))
                    if (!$util.isInteger(message.price) && !(message.price && $util.isInteger(message.price.low) && $util.isInteger(message.price.high)))
                        return "price: integer|Long expected";
                if (message.size != null && message.hasOwnProperty("size"))
                    if (!$util.isInteger(message.size))
                        return "size: integer expected";
                if (message.orders != null && message.hasOwnProperty("orders"))
                    if (!$util.isInteger(message.orders))
                        return "orders: integer expected";
                return null;
            };

            /**
             * Creates a DepthLevel message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.DepthLevel
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.DepthLevel} DepthLevel
             */
            DepthLevel.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.DepthLevel)
                    return object;
                let message = new $root.alg.live.DepthLevel();
                if (object.price != null)
                    if ($util.Long)
                        (message.price = $util.Long.fromValue(object.price)).unsigned = false;
                    else if (typeof object.price === "string")
                        message.price = parseInt(object.price, 10);
                    else if (typeof object.price === "number")
                        message.price = object.price;
                    else if (typeof object.price === "object")
                        message.price = new $util.LongBits(object.price.low >>> 0, object.price.high >>> 0).toNumber();
                if (object.size != null)
                    message.size = object.size >>> 0;
                if (object.orders != null)
                    message.orders = object.orders >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a DepthLevel message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.DepthLevel
             * @static
             * @param {alg.live.DepthLevel} message DepthLevel
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DepthLevel.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.price = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.price = options.longs === String ? "0" : 0;
                    object.size = 0;
                    object.orders = 0;
                }
                if (message.price != null && message.hasOwnProperty("price"))
                    if (typeof message.price === "number")
                        object.price = options.longs === String ? String(message.price) : message.price;
                    else
                        object.price = options.longs === String ? $util.Long.prototype.toString.call(message.price) : options.longs === Number ? new $util.LongBits(message.price.low >>> 0, message.price.high >>> 0).toNumber() : message.price;
                if (message.size != null && message.hasOwnProperty("size"))
                    object.size = message.size;
                if (message.orders != null && message.hasOwnProperty("orders"))
                    object.orders = message.orders;
                return object;
            };

            /**
             * Converts this DepthLevel to JSON.
             * @function toJSON
             * @memberof alg.live.DepthLevel
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DepthLevel.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DepthLevel
             * @function getTypeUrl
             * @memberof alg.live.DepthLevel
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DepthLevel.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.DepthLevel";
            };

            return DepthLevel;
        })();

        live.DepthSnapshot = (function() {

            /**
             * Properties of a DepthSnapshot.
             * @memberof alg.live
             * @interface IDepthSnapshot
             * @property {string|null} [symbol] DepthSnapshot symbol
             * @property {Array.<alg.live.IDepthLevel>|null} [bids] DepthSnapshot bids
             * @property {Array.<alg.live.IDepthLevel>|null} [asks] DepthSnapshot asks
             * @property {number|Long|null} [timestamp] DepthSnapshot timestamp
             * @property {number|Long|null} [serverTs] DepthSnapshot serverTs
             */

            /**
             * Constructs a new DepthSnapshot.
             * @memberof alg.live
             * @classdesc Represents a DepthSnapshot.
             * @implements IDepthSnapshot
             * @constructor
             * @param {alg.live.IDepthSnapshot=} [properties] Properties to set
             */
            function DepthSnapshot(properties) {
                this.bids = [];
                this.asks = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DepthSnapshot symbol.
             * @member {string} symbol
             * @memberof alg.live.DepthSnapshot
             * @instance
             */
            DepthSnapshot.prototype.symbol = "";

            /**
             * DepthSnapshot bids.
             * @member {Array.<alg.live.IDepthLevel>} bids
             * @memberof alg.live.DepthSnapshot
             * @instance
             */
            DepthSnapshot.prototype.bids = $util.emptyArray;

            /**
             * DepthSnapshot asks.
             * @member {Array.<alg.live.IDepthLevel>} asks
             * @memberof alg.live.DepthSnapshot
             * @instance
             */
            DepthSnapshot.prototype.asks = $util.emptyArray;

            /**
             * DepthSnapshot timestamp.
             * @member {number|Long} timestamp
             * @memberof alg.live.DepthSnapshot
             * @instance
             */
            DepthSnapshot.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * DepthSnapshot serverTs.
             * @member {number|Long} serverTs
             * @memberof alg.live.DepthSnapshot
             * @instance
             */
            DepthSnapshot.prototype.serverTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new DepthSnapshot instance using the specified properties.
             * @function create
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {alg.live.IDepthSnapshot=} [properties] Properties to set
             * @returns {alg.live.DepthSnapshot} DepthSnapshot instance
             */
            DepthSnapshot.create = function create(properties) {
                return new DepthSnapshot(properties);
            };

            /**
             * Encodes the specified DepthSnapshot message. Does not implicitly {@link alg.live.DepthSnapshot.verify|verify} messages.
             * @function encode
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {alg.live.IDepthSnapshot} message DepthSnapshot message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DepthSnapshot.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.bids != null && message.bids.length)
                    for (let i = 0; i < message.bids.length; ++i)
                        $root.alg.live.DepthLevel.encode(message.bids[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.asks != null && message.asks.length)
                    for (let i = 0; i < message.asks.length; ++i)
                        $root.alg.live.DepthLevel.encode(message.asks[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.timestamp);
                if (message.serverTs != null && Object.hasOwnProperty.call(message, "serverTs"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.serverTs);
                return writer;
            };

            /**
             * Encodes the specified DepthSnapshot message, length delimited. Does not implicitly {@link alg.live.DepthSnapshot.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {alg.live.IDepthSnapshot} message DepthSnapshot message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DepthSnapshot.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DepthSnapshot message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.DepthSnapshot} DepthSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DepthSnapshot.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.DepthSnapshot();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            if (!(message.bids && message.bids.length))
                                message.bids = [];
                            message.bids.push($root.alg.live.DepthLevel.decode(reader, reader.uint32()));
                            break;
                        }
                    case 3: {
                            if (!(message.asks && message.asks.length))
                                message.asks = [];
                            message.asks.push($root.alg.live.DepthLevel.decode(reader, reader.uint32()));
                            break;
                        }
                    case 4: {
                            message.timestamp = reader.int64();
                            break;
                        }
                    case 5: {
                            message.serverTs = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a DepthSnapshot message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.DepthSnapshot} DepthSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DepthSnapshot.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DepthSnapshot message.
             * @function verify
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DepthSnapshot.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.bids != null && message.hasOwnProperty("bids")) {
                    if (!Array.isArray(message.bids))
                        return "bids: array expected";
                    for (let i = 0; i < message.bids.length; ++i) {
                        let error = $root.alg.live.DepthLevel.verify(message.bids[i]);
                        if (error)
                            return "bids." + error;
                    }
                }
                if (message.asks != null && message.hasOwnProperty("asks")) {
                    if (!Array.isArray(message.asks))
                        return "asks: array expected";
                    for (let i = 0; i < message.asks.length; ++i) {
                        let error = $root.alg.live.DepthLevel.verify(message.asks[i]);
                        if (error)
                            return "asks." + error;
                    }
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                if (message.serverTs != null && message.hasOwnProperty("serverTs"))
                    if (!$util.isInteger(message.serverTs) && !(message.serverTs && $util.isInteger(message.serverTs.low) && $util.isInteger(message.serverTs.high)))
                        return "serverTs: integer|Long expected";
                return null;
            };

            /**
             * Creates a DepthSnapshot message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.DepthSnapshot} DepthSnapshot
             */
            DepthSnapshot.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.DepthSnapshot)
                    return object;
                let message = new $root.alg.live.DepthSnapshot();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                if (object.bids) {
                    if (!Array.isArray(object.bids))
                        throw TypeError(".alg.live.DepthSnapshot.bids: array expected");
                    message.bids = [];
                    for (let i = 0; i < object.bids.length; ++i) {
                        if (typeof object.bids[i] !== "object")
                            throw TypeError(".alg.live.DepthSnapshot.bids: object expected");
                        message.bids[i] = $root.alg.live.DepthLevel.fromObject(object.bids[i]);
                    }
                }
                if (object.asks) {
                    if (!Array.isArray(object.asks))
                        throw TypeError(".alg.live.DepthSnapshot.asks: array expected");
                    message.asks = [];
                    for (let i = 0; i < object.asks.length; ++i) {
                        if (typeof object.asks[i] !== "object")
                            throw TypeError(".alg.live.DepthSnapshot.asks: object expected");
                        message.asks[i] = $root.alg.live.DepthLevel.fromObject(object.asks[i]);
                    }
                }
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = false;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
                if (object.serverTs != null)
                    if ($util.Long)
                        (message.serverTs = $util.Long.fromValue(object.serverTs)).unsigned = false;
                    else if (typeof object.serverTs === "string")
                        message.serverTs = parseInt(object.serverTs, 10);
                    else if (typeof object.serverTs === "number")
                        message.serverTs = object.serverTs;
                    else if (typeof object.serverTs === "object")
                        message.serverTs = new $util.LongBits(object.serverTs.low >>> 0, object.serverTs.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a DepthSnapshot message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {alg.live.DepthSnapshot} message DepthSnapshot
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DepthSnapshot.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.bids = [];
                    object.asks = [];
                }
                if (options.defaults) {
                    object.symbol = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.serverTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.serverTs = options.longs === String ? "0" : 0;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.bids && message.bids.length) {
                    object.bids = [];
                    for (let j = 0; j < message.bids.length; ++j)
                        object.bids[j] = $root.alg.live.DepthLevel.toObject(message.bids[j], options);
                }
                if (message.asks && message.asks.length) {
                    object.asks = [];
                    for (let j = 0; j < message.asks.length; ++j)
                        object.asks[j] = $root.alg.live.DepthLevel.toObject(message.asks[j], options);
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
                if (message.serverTs != null && message.hasOwnProperty("serverTs"))
                    if (typeof message.serverTs === "number")
                        object.serverTs = options.longs === String ? String(message.serverTs) : message.serverTs;
                    else
                        object.serverTs = options.longs === String ? $util.Long.prototype.toString.call(message.serverTs) : options.longs === Number ? new $util.LongBits(message.serverTs.low >>> 0, message.serverTs.high >>> 0).toNumber() : message.serverTs;
                return object;
            };

            /**
             * Converts this DepthSnapshot to JSON.
             * @function toJSON
             * @memberof alg.live.DepthSnapshot
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DepthSnapshot.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DepthSnapshot
             * @function getTypeUrl
             * @memberof alg.live.DepthSnapshot
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DepthSnapshot.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.DepthSnapshot";
            };

            return DepthSnapshot;
        })();

        live.HistoricalDepth = (function() {

            /**
             * Properties of a HistoricalDepth.
             * @memberof alg.live
             * @interface IHistoricalDepth
             * @property {string|null} [symbol] HistoricalDepth symbol
             * @property {Array.<alg.live.IDepthSnapshot>|null} [snapshots] HistoricalDepth snapshots
             */

            /**
             * Constructs a new HistoricalDepth.
             * @memberof alg.live
             * @classdesc Represents a HistoricalDepth.
             * @implements IHistoricalDepth
             * @constructor
             * @param {alg.live.IHistoricalDepth=} [properties] Properties to set
             */
            function HistoricalDepth(properties) {
                this.snapshots = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HistoricalDepth symbol.
             * @member {string} symbol
             * @memberof alg.live.HistoricalDepth
             * @instance
             */
            HistoricalDepth.prototype.symbol = "";

            /**
             * HistoricalDepth snapshots.
             * @member {Array.<alg.live.IDepthSnapshot>} snapshots
             * @memberof alg.live.HistoricalDepth
             * @instance
             */
            HistoricalDepth.prototype.snapshots = $util.emptyArray;

            /**
             * Creates a new HistoricalDepth instance using the specified properties.
             * @function create
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {alg.live.IHistoricalDepth=} [properties] Properties to set
             * @returns {alg.live.HistoricalDepth} HistoricalDepth instance
             */
            HistoricalDepth.create = function create(properties) {
                return new HistoricalDepth(properties);
            };

            /**
             * Encodes the specified HistoricalDepth message. Does not implicitly {@link alg.live.HistoricalDepth.verify|verify} messages.
             * @function encode
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {alg.live.IHistoricalDepth} message HistoricalDepth message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HistoricalDepth.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.snapshots != null && message.snapshots.length)
                    for (let i = 0; i < message.snapshots.length; ++i)
                        $root.alg.live.DepthSnapshot.encode(message.snapshots[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified HistoricalDepth message, length delimited. Does not implicitly {@link alg.live.HistoricalDepth.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {alg.live.IHistoricalDepth} message HistoricalDepth message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HistoricalDepth.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HistoricalDepth message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.HistoricalDepth} HistoricalDepth
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HistoricalDepth.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.HistoricalDepth();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            if (!(message.snapshots && message.snapshots.length))
                                message.snapshots = [];
                            message.snapshots.push($root.alg.live.DepthSnapshot.decode(reader, reader.uint32()));
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a HistoricalDepth message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.HistoricalDepth} HistoricalDepth
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HistoricalDepth.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HistoricalDepth message.
             * @function verify
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HistoricalDepth.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.snapshots != null && message.hasOwnProperty("snapshots")) {
                    if (!Array.isArray(message.snapshots))
                        return "snapshots: array expected";
                    for (let i = 0; i < message.snapshots.length; ++i) {
                        let error = $root.alg.live.DepthSnapshot.verify(message.snapshots[i]);
                        if (error)
                            return "snapshots." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a HistoricalDepth message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.HistoricalDepth} HistoricalDepth
             */
            HistoricalDepth.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.HistoricalDepth)
                    return object;
                let message = new $root.alg.live.HistoricalDepth();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                if (object.snapshots) {
                    if (!Array.isArray(object.snapshots))
                        throw TypeError(".alg.live.HistoricalDepth.snapshots: array expected");
                    message.snapshots = [];
                    for (let i = 0; i < object.snapshots.length; ++i) {
                        if (typeof object.snapshots[i] !== "object")
                            throw TypeError(".alg.live.HistoricalDepth.snapshots: object expected");
                        message.snapshots[i] = $root.alg.live.DepthSnapshot.fromObject(object.snapshots[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a HistoricalDepth message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {alg.live.HistoricalDepth} message HistoricalDepth
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HistoricalDepth.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.snapshots = [];
                if (options.defaults)
                    object.symbol = "";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.snapshots && message.snapshots.length) {
                    object.snapshots = [];
                    for (let j = 0; j < message.snapshots.length; ++j)
                        object.snapshots[j] = $root.alg.live.DepthSnapshot.toObject(message.snapshots[j], options);
                }
                return object;
            };

            /**
             * Converts this HistoricalDepth to JSON.
             * @function toJSON
             * @memberof alg.live.HistoricalDepth
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HistoricalDepth.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for HistoricalDepth
             * @function getTypeUrl
             * @memberof alg.live.HistoricalDepth
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            HistoricalDepth.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.HistoricalDepth";
            };

            return HistoricalDepth;
        })();

        live.AvailableSymbols = (function() {

            /**
             * Properties of an AvailableSymbols.
             * @memberof alg.live
             * @interface IAvailableSymbols
             * @property {Array.<alg.live.ISymbolInfo>|null} [symbols] AvailableSymbols symbols
             */

            /**
             * Constructs a new AvailableSymbols.
             * @memberof alg.live
             * @classdesc Represents an AvailableSymbols.
             * @implements IAvailableSymbols
             * @constructor
             * @param {alg.live.IAvailableSymbols=} [properties] Properties to set
             */
            function AvailableSymbols(properties) {
                this.symbols = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * AvailableSymbols symbols.
             * @member {Array.<alg.live.ISymbolInfo>} symbols
             * @memberof alg.live.AvailableSymbols
             * @instance
             */
            AvailableSymbols.prototype.symbols = $util.emptyArray;

            /**
             * Creates a new AvailableSymbols instance using the specified properties.
             * @function create
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {alg.live.IAvailableSymbols=} [properties] Properties to set
             * @returns {alg.live.AvailableSymbols} AvailableSymbols instance
             */
            AvailableSymbols.create = function create(properties) {
                return new AvailableSymbols(properties);
            };

            /**
             * Encodes the specified AvailableSymbols message. Does not implicitly {@link alg.live.AvailableSymbols.verify|verify} messages.
             * @function encode
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {alg.live.IAvailableSymbols} message AvailableSymbols message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AvailableSymbols.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbols != null && message.symbols.length)
                    for (let i = 0; i < message.symbols.length; ++i)
                        $root.alg.live.SymbolInfo.encode(message.symbols[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified AvailableSymbols message, length delimited. Does not implicitly {@link alg.live.AvailableSymbols.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {alg.live.IAvailableSymbols} message AvailableSymbols message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AvailableSymbols.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an AvailableSymbols message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.AvailableSymbols} AvailableSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AvailableSymbols.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.AvailableSymbols();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.symbols && message.symbols.length))
                                message.symbols = [];
                            message.symbols.push($root.alg.live.SymbolInfo.decode(reader, reader.uint32()));
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an AvailableSymbols message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.AvailableSymbols} AvailableSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AvailableSymbols.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an AvailableSymbols message.
             * @function verify
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            AvailableSymbols.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbols != null && message.hasOwnProperty("symbols")) {
                    if (!Array.isArray(message.symbols))
                        return "symbols: array expected";
                    for (let i = 0; i < message.symbols.length; ++i) {
                        let error = $root.alg.live.SymbolInfo.verify(message.symbols[i]);
                        if (error)
                            return "symbols." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an AvailableSymbols message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.AvailableSymbols} AvailableSymbols
             */
            AvailableSymbols.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.AvailableSymbols)
                    return object;
                let message = new $root.alg.live.AvailableSymbols();
                if (object.symbols) {
                    if (!Array.isArray(object.symbols))
                        throw TypeError(".alg.live.AvailableSymbols.symbols: array expected");
                    message.symbols = [];
                    for (let i = 0; i < object.symbols.length; ++i) {
                        if (typeof object.symbols[i] !== "object")
                            throw TypeError(".alg.live.AvailableSymbols.symbols: object expected");
                        message.symbols[i] = $root.alg.live.SymbolInfo.fromObject(object.symbols[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from an AvailableSymbols message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {alg.live.AvailableSymbols} message AvailableSymbols
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AvailableSymbols.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.symbols = [];
                if (message.symbols && message.symbols.length) {
                    object.symbols = [];
                    for (let j = 0; j < message.symbols.length; ++j)
                        object.symbols[j] = $root.alg.live.SymbolInfo.toObject(message.symbols[j], options);
                }
                return object;
            };

            /**
             * Converts this AvailableSymbols to JSON.
             * @function toJSON
             * @memberof alg.live.AvailableSymbols
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AvailableSymbols.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AvailableSymbols
             * @function getTypeUrl
             * @memberof alg.live.AvailableSymbols
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AvailableSymbols.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.AvailableSymbols";
            };

            return AvailableSymbols;
        })();

        live.SymbolSearchResult = (function() {

            /**
             * Properties of a SymbolSearchResult.
             * @memberof alg.live
             * @interface ISymbolSearchResult
             * @property {Array.<string>|null} [symbols] SymbolSearchResult symbols
             * @property {string|null} [searchText] SymbolSearchResult searchText
             */

            /**
             * Constructs a new SymbolSearchResult.
             * @memberof alg.live
             * @classdesc Represents a SymbolSearchResult.
             * @implements ISymbolSearchResult
             * @constructor
             * @param {alg.live.ISymbolSearchResult=} [properties] Properties to set
             */
            function SymbolSearchResult(properties) {
                this.symbols = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SymbolSearchResult symbols.
             * @member {Array.<string>} symbols
             * @memberof alg.live.SymbolSearchResult
             * @instance
             */
            SymbolSearchResult.prototype.symbols = $util.emptyArray;

            /**
             * SymbolSearchResult searchText.
             * @member {string} searchText
             * @memberof alg.live.SymbolSearchResult
             * @instance
             */
            SymbolSearchResult.prototype.searchText = "";

            /**
             * Creates a new SymbolSearchResult instance using the specified properties.
             * @function create
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {alg.live.ISymbolSearchResult=} [properties] Properties to set
             * @returns {alg.live.SymbolSearchResult} SymbolSearchResult instance
             */
            SymbolSearchResult.create = function create(properties) {
                return new SymbolSearchResult(properties);
            };

            /**
             * Encodes the specified SymbolSearchResult message. Does not implicitly {@link alg.live.SymbolSearchResult.verify|verify} messages.
             * @function encode
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {alg.live.ISymbolSearchResult} message SymbolSearchResult message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SymbolSearchResult.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbols != null && message.symbols.length)
                    for (let i = 0; i < message.symbols.length; ++i)
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbols[i]);
                if (message.searchText != null && Object.hasOwnProperty.call(message, "searchText"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.searchText);
                return writer;
            };

            /**
             * Encodes the specified SymbolSearchResult message, length delimited. Does not implicitly {@link alg.live.SymbolSearchResult.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {alg.live.ISymbolSearchResult} message SymbolSearchResult message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SymbolSearchResult.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SymbolSearchResult message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.SymbolSearchResult} SymbolSearchResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SymbolSearchResult.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.SymbolSearchResult();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.symbols && message.symbols.length))
                                message.symbols = [];
                            message.symbols.push(reader.string());
                            break;
                        }
                    case 2: {
                            message.searchText = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SymbolSearchResult message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.SymbolSearchResult} SymbolSearchResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SymbolSearchResult.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SymbolSearchResult message.
             * @function verify
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SymbolSearchResult.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbols != null && message.hasOwnProperty("symbols")) {
                    if (!Array.isArray(message.symbols))
                        return "symbols: array expected";
                    for (let i = 0; i < message.symbols.length; ++i)
                        if (!$util.isString(message.symbols[i]))
                            return "symbols: string[] expected";
                }
                if (message.searchText != null && message.hasOwnProperty("searchText"))
                    if (!$util.isString(message.searchText))
                        return "searchText: string expected";
                return null;
            };

            /**
             * Creates a SymbolSearchResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.SymbolSearchResult} SymbolSearchResult
             */
            SymbolSearchResult.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.SymbolSearchResult)
                    return object;
                let message = new $root.alg.live.SymbolSearchResult();
                if (object.symbols) {
                    if (!Array.isArray(object.symbols))
                        throw TypeError(".alg.live.SymbolSearchResult.symbols: array expected");
                    message.symbols = [];
                    for (let i = 0; i < object.symbols.length; ++i)
                        message.symbols[i] = String(object.symbols[i]);
                }
                if (object.searchText != null)
                    message.searchText = String(object.searchText);
                return message;
            };

            /**
             * Creates a plain object from a SymbolSearchResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {alg.live.SymbolSearchResult} message SymbolSearchResult
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SymbolSearchResult.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.symbols = [];
                if (options.defaults)
                    object.searchText = "";
                if (message.symbols && message.symbols.length) {
                    object.symbols = [];
                    for (let j = 0; j < message.symbols.length; ++j)
                        object.symbols[j] = message.symbols[j];
                }
                if (message.searchText != null && message.hasOwnProperty("searchText"))
                    object.searchText = message.searchText;
                return object;
            };

            /**
             * Converts this SymbolSearchResult to JSON.
             * @function toJSON
             * @memberof alg.live.SymbolSearchResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SymbolSearchResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SymbolSearchResult
             * @function getTypeUrl
             * @memberof alg.live.SymbolSearchResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SymbolSearchResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.SymbolSearchResult";
            };

            return SymbolSearchResult;
        })();

        live.Subscribe = (function() {

            /**
             * Properties of a Subscribe.
             * @memberof alg.live
             * @interface ISubscribe
             * @property {string|null} [symbol] Subscribe symbol
             * @property {string|null} [exchange] Subscribe exchange
             * @property {alg.live.Timeframe|null} [timeframe] Subscribe timeframe
             * @property {alg.live.HistoricalSource|null} [historicalSource] Subscribe historicalSource
             * @property {number|null} [historicalCount] Subscribe historicalCount
             */

            /**
             * Constructs a new Subscribe.
             * @memberof alg.live
             * @classdesc Represents a Subscribe.
             * @implements ISubscribe
             * @constructor
             * @param {alg.live.ISubscribe=} [properties] Properties to set
             */
            function Subscribe(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Subscribe symbol.
             * @member {string} symbol
             * @memberof alg.live.Subscribe
             * @instance
             */
            Subscribe.prototype.symbol = "";

            /**
             * Subscribe exchange.
             * @member {string} exchange
             * @memberof alg.live.Subscribe
             * @instance
             */
            Subscribe.prototype.exchange = "";

            /**
             * Subscribe timeframe.
             * @member {alg.live.Timeframe} timeframe
             * @memberof alg.live.Subscribe
             * @instance
             */
            Subscribe.prototype.timeframe = 0;

            /**
             * Subscribe historicalSource.
             * @member {alg.live.HistoricalSource} historicalSource
             * @memberof alg.live.Subscribe
             * @instance
             */
            Subscribe.prototype.historicalSource = 0;

            /**
             * Subscribe historicalCount.
             * @member {number} historicalCount
             * @memberof alg.live.Subscribe
             * @instance
             */
            Subscribe.prototype.historicalCount = 0;

            /**
             * Creates a new Subscribe instance using the specified properties.
             * @function create
             * @memberof alg.live.Subscribe
             * @static
             * @param {alg.live.ISubscribe=} [properties] Properties to set
             * @returns {alg.live.Subscribe} Subscribe instance
             */
            Subscribe.create = function create(properties) {
                return new Subscribe(properties);
            };

            /**
             * Encodes the specified Subscribe message. Does not implicitly {@link alg.live.Subscribe.verify|verify} messages.
             * @function encode
             * @memberof alg.live.Subscribe
             * @static
             * @param {alg.live.ISubscribe} message Subscribe message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Subscribe.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.exchange != null && Object.hasOwnProperty.call(message, "exchange"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.exchange);
                if (message.timeframe != null && Object.hasOwnProperty.call(message, "timeframe"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.timeframe);
                if (message.historicalSource != null && Object.hasOwnProperty.call(message, "historicalSource"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.historicalSource);
                if (message.historicalCount != null && Object.hasOwnProperty.call(message, "historicalCount"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.historicalCount);
                return writer;
            };

            /**
             * Encodes the specified Subscribe message, length delimited. Does not implicitly {@link alg.live.Subscribe.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.Subscribe
             * @static
             * @param {alg.live.ISubscribe} message Subscribe message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Subscribe.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Subscribe message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.Subscribe
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.Subscribe} Subscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Subscribe.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.Subscribe();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.exchange = reader.string();
                            break;
                        }
                    case 3: {
                            message.timeframe = reader.int32();
                            break;
                        }
                    case 4: {
                            message.historicalSource = reader.int32();
                            break;
                        }
                    case 5: {
                            message.historicalCount = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Subscribe message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.Subscribe
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.Subscribe} Subscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Subscribe.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Subscribe message.
             * @function verify
             * @memberof alg.live.Subscribe
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Subscribe.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.exchange != null && message.hasOwnProperty("exchange"))
                    if (!$util.isString(message.exchange))
                        return "exchange: string expected";
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    switch (message.timeframe) {
                    default:
                        return "timeframe: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        break;
                    }
                if (message.historicalSource != null && message.hasOwnProperty("historicalSource"))
                    switch (message.historicalSource) {
                    default:
                        return "historicalSource: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                if (message.historicalCount != null && message.hasOwnProperty("historicalCount"))
                    if (!$util.isInteger(message.historicalCount))
                        return "historicalCount: integer expected";
                return null;
            };

            /**
             * Creates a Subscribe message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.Subscribe
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.Subscribe} Subscribe
             */
            Subscribe.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.Subscribe)
                    return object;
                let message = new $root.alg.live.Subscribe();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                if (object.exchange != null)
                    message.exchange = String(object.exchange);
                switch (object.timeframe) {
                default:
                    if (typeof object.timeframe === "number") {
                        message.timeframe = object.timeframe;
                        break;
                    }
                    break;
                case "TIMEFRAME_UNKNOWN":
                case 0:
                    message.timeframe = 0;
                    break;
                case "S1":
                case 1:
                    message.timeframe = 1;
                    break;
                case "S5":
                case 2:
                    message.timeframe = 2;
                    break;
                case "M1":
                case 3:
                    message.timeframe = 3;
                    break;
                case "M5":
                case 4:
                    message.timeframe = 4;
                    break;
                case "M15":
                case 5:
                    message.timeframe = 5;
                    break;
                case "H1":
                case 6:
                    message.timeframe = 6;
                    break;
                case "H4":
                case 7:
                    message.timeframe = 7;
                    break;
                case "D1":
                case 8:
                    message.timeframe = 8;
                    break;
                }
                switch (object.historicalSource) {
                default:
                    if (typeof object.historicalSource === "number") {
                        message.historicalSource = object.historicalSource;
                        break;
                    }
                    break;
                case "HISTORICAL_AUTO":
                case 0:
                    message.historicalSource = 0;
                    break;
                case "HISTORICAL_RITHMIC":
                case 1:
                    message.historicalSource = 1;
                    break;
                case "HISTORICAL_DATABENTO":
                case 2:
                    message.historicalSource = 2;
                    break;
                case "HISTORICAL_NONE":
                case 3:
                    message.historicalSource = 3;
                    break;
                }
                if (object.historicalCount != null)
                    message.historicalCount = object.historicalCount | 0;
                return message;
            };

            /**
             * Creates a plain object from a Subscribe message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.Subscribe
             * @static
             * @param {alg.live.Subscribe} message Subscribe
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Subscribe.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    object.exchange = "";
                    object.timeframe = options.enums === String ? "TIMEFRAME_UNKNOWN" : 0;
                    object.historicalSource = options.enums === String ? "HISTORICAL_AUTO" : 0;
                    object.historicalCount = 0;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.exchange != null && message.hasOwnProperty("exchange"))
                    object.exchange = message.exchange;
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    object.timeframe = options.enums === String ? $root.alg.live.Timeframe[message.timeframe] === undefined ? message.timeframe : $root.alg.live.Timeframe[message.timeframe] : message.timeframe;
                if (message.historicalSource != null && message.hasOwnProperty("historicalSource"))
                    object.historicalSource = options.enums === String ? $root.alg.live.HistoricalSource[message.historicalSource] === undefined ? message.historicalSource : $root.alg.live.HistoricalSource[message.historicalSource] : message.historicalSource;
                if (message.historicalCount != null && message.hasOwnProperty("historicalCount"))
                    object.historicalCount = message.historicalCount;
                return object;
            };

            /**
             * Converts this Subscribe to JSON.
             * @function toJSON
             * @memberof alg.live.Subscribe
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Subscribe.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Subscribe
             * @function getTypeUrl
             * @memberof alg.live.Subscribe
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Subscribe.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.Subscribe";
            };

            return Subscribe;
        })();

        live.Unsubscribe = (function() {

            /**
             * Properties of an Unsubscribe.
             * @memberof alg.live
             * @interface IUnsubscribe
             * @property {string|null} [symbol] Unsubscribe symbol
             */

            /**
             * Constructs a new Unsubscribe.
             * @memberof alg.live
             * @classdesc Represents an Unsubscribe.
             * @implements IUnsubscribe
             * @constructor
             * @param {alg.live.IUnsubscribe=} [properties] Properties to set
             */
            function Unsubscribe(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Unsubscribe symbol.
             * @member {string} symbol
             * @memberof alg.live.Unsubscribe
             * @instance
             */
            Unsubscribe.prototype.symbol = "";

            /**
             * Creates a new Unsubscribe instance using the specified properties.
             * @function create
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {alg.live.IUnsubscribe=} [properties] Properties to set
             * @returns {alg.live.Unsubscribe} Unsubscribe instance
             */
            Unsubscribe.create = function create(properties) {
                return new Unsubscribe(properties);
            };

            /**
             * Encodes the specified Unsubscribe message. Does not implicitly {@link alg.live.Unsubscribe.verify|verify} messages.
             * @function encode
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {alg.live.IUnsubscribe} message Unsubscribe message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Unsubscribe.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                return writer;
            };

            /**
             * Encodes the specified Unsubscribe message, length delimited. Does not implicitly {@link alg.live.Unsubscribe.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {alg.live.IUnsubscribe} message Unsubscribe message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Unsubscribe.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Unsubscribe message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.Unsubscribe} Unsubscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Unsubscribe.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.Unsubscribe();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Unsubscribe message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.Unsubscribe} Unsubscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Unsubscribe.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Unsubscribe message.
             * @function verify
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Unsubscribe.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                return null;
            };

            /**
             * Creates an Unsubscribe message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.Unsubscribe} Unsubscribe
             */
            Unsubscribe.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.Unsubscribe)
                    return object;
                let message = new $root.alg.live.Unsubscribe();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                return message;
            };

            /**
             * Creates a plain object from an Unsubscribe message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {alg.live.Unsubscribe} message Unsubscribe
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Unsubscribe.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.symbol = "";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                return object;
            };

            /**
             * Converts this Unsubscribe to JSON.
             * @function toJSON
             * @memberof alg.live.Unsubscribe
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Unsubscribe.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Unsubscribe
             * @function getTypeUrl
             * @memberof alg.live.Unsubscribe
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Unsubscribe.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.Unsubscribe";
            };

            return Unsubscribe;
        })();

        live.Subscribed = (function() {

            /**
             * Properties of a Subscribed.
             * @memberof alg.live
             * @interface ISubscribed
             * @property {string|null} [symbol] Subscribed symbol
             * @property {alg.live.Timeframe|null} [timeframe] Subscribed timeframe
             */

            /**
             * Constructs a new Subscribed.
             * @memberof alg.live
             * @classdesc Represents a Subscribed.
             * @implements ISubscribed
             * @constructor
             * @param {alg.live.ISubscribed=} [properties] Properties to set
             */
            function Subscribed(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Subscribed symbol.
             * @member {string} symbol
             * @memberof alg.live.Subscribed
             * @instance
             */
            Subscribed.prototype.symbol = "";

            /**
             * Subscribed timeframe.
             * @member {alg.live.Timeframe} timeframe
             * @memberof alg.live.Subscribed
             * @instance
             */
            Subscribed.prototype.timeframe = 0;

            /**
             * Creates a new Subscribed instance using the specified properties.
             * @function create
             * @memberof alg.live.Subscribed
             * @static
             * @param {alg.live.ISubscribed=} [properties] Properties to set
             * @returns {alg.live.Subscribed} Subscribed instance
             */
            Subscribed.create = function create(properties) {
                return new Subscribed(properties);
            };

            /**
             * Encodes the specified Subscribed message. Does not implicitly {@link alg.live.Subscribed.verify|verify} messages.
             * @function encode
             * @memberof alg.live.Subscribed
             * @static
             * @param {alg.live.ISubscribed} message Subscribed message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Subscribed.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.symbol);
                if (message.timeframe != null && Object.hasOwnProperty.call(message, "timeframe"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.timeframe);
                return writer;
            };

            /**
             * Encodes the specified Subscribed message, length delimited. Does not implicitly {@link alg.live.Subscribed.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.Subscribed
             * @static
             * @param {alg.live.ISubscribed} message Subscribed message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Subscribed.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Subscribed message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.Subscribed
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.Subscribed} Subscribed
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Subscribed.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.Subscribed();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.symbol = reader.string();
                            break;
                        }
                    case 2: {
                            message.timeframe = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Subscribed message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.Subscribed
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.Subscribed} Subscribed
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Subscribed.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Subscribed message.
             * @function verify
             * @memberof alg.live.Subscribed
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Subscribed.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    if (!$util.isString(message.symbol))
                        return "symbol: string expected";
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    switch (message.timeframe) {
                    default:
                        return "timeframe: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        break;
                    }
                return null;
            };

            /**
             * Creates a Subscribed message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.Subscribed
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.Subscribed} Subscribed
             */
            Subscribed.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.Subscribed)
                    return object;
                let message = new $root.alg.live.Subscribed();
                if (object.symbol != null)
                    message.symbol = String(object.symbol);
                switch (object.timeframe) {
                default:
                    if (typeof object.timeframe === "number") {
                        message.timeframe = object.timeframe;
                        break;
                    }
                    break;
                case "TIMEFRAME_UNKNOWN":
                case 0:
                    message.timeframe = 0;
                    break;
                case "S1":
                case 1:
                    message.timeframe = 1;
                    break;
                case "S5":
                case 2:
                    message.timeframe = 2;
                    break;
                case "M1":
                case 3:
                    message.timeframe = 3;
                    break;
                case "M5":
                case 4:
                    message.timeframe = 4;
                    break;
                case "M15":
                case 5:
                    message.timeframe = 5;
                    break;
                case "H1":
                case 6:
                    message.timeframe = 6;
                    break;
                case "H4":
                case 7:
                    message.timeframe = 7;
                    break;
                case "D1":
                case 8:
                    message.timeframe = 8;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a Subscribed message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.Subscribed
             * @static
             * @param {alg.live.Subscribed} message Subscribed
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Subscribed.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.symbol = "";
                    object.timeframe = options.enums === String ? "TIMEFRAME_UNKNOWN" : 0;
                }
                if (message.symbol != null && message.hasOwnProperty("symbol"))
                    object.symbol = message.symbol;
                if (message.timeframe != null && message.hasOwnProperty("timeframe"))
                    object.timeframe = options.enums === String ? $root.alg.live.Timeframe[message.timeframe] === undefined ? message.timeframe : $root.alg.live.Timeframe[message.timeframe] : message.timeframe;
                return object;
            };

            /**
             * Converts this Subscribed to JSON.
             * @function toJSON
             * @memberof alg.live.Subscribed
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Subscribed.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Subscribed
             * @function getTypeUrl
             * @memberof alg.live.Subscribed
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Subscribed.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.Subscribed";
            };

            return Subscribed;
        })();

        live.SearchSymbols = (function() {

            /**
             * Properties of a SearchSymbols.
             * @memberof alg.live
             * @interface ISearchSymbols
             * @property {string|null} [searchText] SearchSymbols searchText
             * @property {string|null} [exchange] SearchSymbols exchange
             */

            /**
             * Constructs a new SearchSymbols.
             * @memberof alg.live
             * @classdesc Represents a SearchSymbols.
             * @implements ISearchSymbols
             * @constructor
             * @param {alg.live.ISearchSymbols=} [properties] Properties to set
             */
            function SearchSymbols(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SearchSymbols searchText.
             * @member {string} searchText
             * @memberof alg.live.SearchSymbols
             * @instance
             */
            SearchSymbols.prototype.searchText = "";

            /**
             * SearchSymbols exchange.
             * @member {string|null|undefined} exchange
             * @memberof alg.live.SearchSymbols
             * @instance
             */
            SearchSymbols.prototype.exchange = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(SearchSymbols.prototype, "_exchange", {
                get: $util.oneOfGetter($oneOfFields = ["exchange"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new SearchSymbols instance using the specified properties.
             * @function create
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {alg.live.ISearchSymbols=} [properties] Properties to set
             * @returns {alg.live.SearchSymbols} SearchSymbols instance
             */
            SearchSymbols.create = function create(properties) {
                return new SearchSymbols(properties);
            };

            /**
             * Encodes the specified SearchSymbols message. Does not implicitly {@link alg.live.SearchSymbols.verify|verify} messages.
             * @function encode
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {alg.live.ISearchSymbols} message SearchSymbols message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SearchSymbols.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.searchText != null && Object.hasOwnProperty.call(message, "searchText"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.searchText);
                if (message.exchange != null && Object.hasOwnProperty.call(message, "exchange"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.exchange);
                return writer;
            };

            /**
             * Encodes the specified SearchSymbols message, length delimited. Does not implicitly {@link alg.live.SearchSymbols.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {alg.live.ISearchSymbols} message SearchSymbols message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SearchSymbols.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SearchSymbols message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.SearchSymbols} SearchSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SearchSymbols.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.SearchSymbols();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.searchText = reader.string();
                            break;
                        }
                    case 2: {
                            message.exchange = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SearchSymbols message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.SearchSymbols} SearchSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SearchSymbols.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SearchSymbols message.
             * @function verify
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SearchSymbols.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.searchText != null && message.hasOwnProperty("searchText"))
                    if (!$util.isString(message.searchText))
                        return "searchText: string expected";
                if (message.exchange != null && message.hasOwnProperty("exchange")) {
                    properties._exchange = 1;
                    if (!$util.isString(message.exchange))
                        return "exchange: string expected";
                }
                return null;
            };

            /**
             * Creates a SearchSymbols message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.SearchSymbols} SearchSymbols
             */
            SearchSymbols.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.SearchSymbols)
                    return object;
                let message = new $root.alg.live.SearchSymbols();
                if (object.searchText != null)
                    message.searchText = String(object.searchText);
                if (object.exchange != null)
                    message.exchange = String(object.exchange);
                return message;
            };

            /**
             * Creates a plain object from a SearchSymbols message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {alg.live.SearchSymbols} message SearchSymbols
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SearchSymbols.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.searchText = "";
                if (message.searchText != null && message.hasOwnProperty("searchText"))
                    object.searchText = message.searchText;
                if (message.exchange != null && message.hasOwnProperty("exchange")) {
                    object.exchange = message.exchange;
                    if (options.oneofs)
                        object._exchange = "exchange";
                }
                return object;
            };

            /**
             * Converts this SearchSymbols to JSON.
             * @function toJSON
             * @memberof alg.live.SearchSymbols
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SearchSymbols.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SearchSymbols
             * @function getTypeUrl
             * @memberof alg.live.SearchSymbols
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SearchSymbols.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.SearchSymbols";
            };

            return SearchSymbols;
        })();

        live.SetMode = (function() {

            /**
             * Properties of a SetMode.
             * @memberof alg.live
             * @interface ISetMode
             * @property {alg.live.DataMode|null} [dataMode] SetMode dataMode
             * @property {alg.live.TradeMode|null} [tradeMode] SetMode tradeMode
             * @property {alg.live.DataProvider|null} [dataProvider] SetMode dataProvider
             */

            /**
             * Constructs a new SetMode.
             * @memberof alg.live
             * @classdesc Represents a SetMode.
             * @implements ISetMode
             * @constructor
             * @param {alg.live.ISetMode=} [properties] Properties to set
             */
            function SetMode(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SetMode dataMode.
             * @member {alg.live.DataMode} dataMode
             * @memberof alg.live.SetMode
             * @instance
             */
            SetMode.prototype.dataMode = 0;

            /**
             * SetMode tradeMode.
             * @member {alg.live.TradeMode} tradeMode
             * @memberof alg.live.SetMode
             * @instance
             */
            SetMode.prototype.tradeMode = 0;

            /**
             * SetMode dataProvider.
             * @member {alg.live.DataProvider} dataProvider
             * @memberof alg.live.SetMode
             * @instance
             */
            SetMode.prototype.dataProvider = 0;

            /**
             * Creates a new SetMode instance using the specified properties.
             * @function create
             * @memberof alg.live.SetMode
             * @static
             * @param {alg.live.ISetMode=} [properties] Properties to set
             * @returns {alg.live.SetMode} SetMode instance
             */
            SetMode.create = function create(properties) {
                return new SetMode(properties);
            };

            /**
             * Encodes the specified SetMode message. Does not implicitly {@link alg.live.SetMode.verify|verify} messages.
             * @function encode
             * @memberof alg.live.SetMode
             * @static
             * @param {alg.live.ISetMode} message SetMode message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetMode.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.dataMode != null && Object.hasOwnProperty.call(message, "dataMode"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.dataMode);
                if (message.tradeMode != null && Object.hasOwnProperty.call(message, "tradeMode"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.tradeMode);
                if (message.dataProvider != null && Object.hasOwnProperty.call(message, "dataProvider"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.dataProvider);
                return writer;
            };

            /**
             * Encodes the specified SetMode message, length delimited. Does not implicitly {@link alg.live.SetMode.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.SetMode
             * @static
             * @param {alg.live.ISetMode} message SetMode message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetMode.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SetMode message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.SetMode
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.SetMode} SetMode
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetMode.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.SetMode();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.dataMode = reader.int32();
                            break;
                        }
                    case 2: {
                            message.tradeMode = reader.int32();
                            break;
                        }
                    case 3: {
                            message.dataProvider = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SetMode message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.SetMode
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.SetMode} SetMode
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetMode.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SetMode message.
             * @function verify
             * @memberof alg.live.SetMode
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SetMode.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.dataMode != null && message.hasOwnProperty("dataMode"))
                    switch (message.dataMode) {
                    default:
                        return "dataMode: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.tradeMode != null && message.hasOwnProperty("tradeMode"))
                    switch (message.tradeMode) {
                    default:
                        return "tradeMode: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.dataProvider != null && message.hasOwnProperty("dataProvider"))
                    switch (message.dataProvider) {
                    default:
                        return "dataProvider: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a SetMode message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.SetMode
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.SetMode} SetMode
             */
            SetMode.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.SetMode)
                    return object;
                let message = new $root.alg.live.SetMode();
                switch (object.dataMode) {
                default:
                    if (typeof object.dataMode === "number") {
                        message.dataMode = object.dataMode;
                        break;
                    }
                    break;
                case "DATA_MODE_UNKNOWN":
                case 0:
                    message.dataMode = 0;
                    break;
                case "DATA_MOCK":
                case 1:
                    message.dataMode = 1;
                    break;
                case "DATA_LIVE":
                case 2:
                    message.dataMode = 2;
                    break;
                }
                switch (object.tradeMode) {
                default:
                    if (typeof object.tradeMode === "number") {
                        message.tradeMode = object.tradeMode;
                        break;
                    }
                    break;
                case "TRADE_MODE_UNKNOWN":
                case 0:
                    message.tradeMode = 0;
                    break;
                case "TRADE_PAPER":
                case 1:
                    message.tradeMode = 1;
                    break;
                case "TRADE_LIVE":
                case 2:
                    message.tradeMode = 2;
                    break;
                }
                switch (object.dataProvider) {
                default:
                    if (typeof object.dataProvider === "number") {
                        message.dataProvider = object.dataProvider;
                        break;
                    }
                    break;
                case "DATA_PROVIDER_NONE":
                case 0:
                    message.dataProvider = 0;
                    break;
                case "DATA_PROVIDER_RITHMIC":
                case 1:
                    message.dataProvider = 1;
                    break;
                case "DATA_PROVIDER_DATABENTO":
                case 2:
                    message.dataProvider = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a SetMode message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.SetMode
             * @static
             * @param {alg.live.SetMode} message SetMode
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SetMode.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.dataMode = options.enums === String ? "DATA_MODE_UNKNOWN" : 0;
                    object.tradeMode = options.enums === String ? "TRADE_MODE_UNKNOWN" : 0;
                    object.dataProvider = options.enums === String ? "DATA_PROVIDER_NONE" : 0;
                }
                if (message.dataMode != null && message.hasOwnProperty("dataMode"))
                    object.dataMode = options.enums === String ? $root.alg.live.DataMode[message.dataMode] === undefined ? message.dataMode : $root.alg.live.DataMode[message.dataMode] : message.dataMode;
                if (message.tradeMode != null && message.hasOwnProperty("tradeMode"))
                    object.tradeMode = options.enums === String ? $root.alg.live.TradeMode[message.tradeMode] === undefined ? message.tradeMode : $root.alg.live.TradeMode[message.tradeMode] : message.tradeMode;
                if (message.dataProvider != null && message.hasOwnProperty("dataProvider"))
                    object.dataProvider = options.enums === String ? $root.alg.live.DataProvider[message.dataProvider] === undefined ? message.dataProvider : $root.alg.live.DataProvider[message.dataProvider] : message.dataProvider;
                return object;
            };

            /**
             * Converts this SetMode to JSON.
             * @function toJSON
             * @memberof alg.live.SetMode
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SetMode.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SetMode
             * @function getTypeUrl
             * @memberof alg.live.SetMode
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SetMode.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.SetMode";
            };

            return SetMode;
        })();

        live.ModeChanged = (function() {

            /**
             * Properties of a ModeChanged.
             * @memberof alg.live
             * @interface IModeChanged
             * @property {alg.live.DataMode|null} [dataMode] ModeChanged dataMode
             * @property {alg.live.TradeMode|null} [tradeMode] ModeChanged tradeMode
             * @property {string|null} [error] ModeChanged error
             * @property {alg.live.DataProvider|null} [dataProvider] ModeChanged dataProvider
             */

            /**
             * Constructs a new ModeChanged.
             * @memberof alg.live
             * @classdesc Represents a ModeChanged.
             * @implements IModeChanged
             * @constructor
             * @param {alg.live.IModeChanged=} [properties] Properties to set
             */
            function ModeChanged(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ModeChanged dataMode.
             * @member {alg.live.DataMode} dataMode
             * @memberof alg.live.ModeChanged
             * @instance
             */
            ModeChanged.prototype.dataMode = 0;

            /**
             * ModeChanged tradeMode.
             * @member {alg.live.TradeMode} tradeMode
             * @memberof alg.live.ModeChanged
             * @instance
             */
            ModeChanged.prototype.tradeMode = 0;

            /**
             * ModeChanged error.
             * @member {string|null|undefined} error
             * @memberof alg.live.ModeChanged
             * @instance
             */
            ModeChanged.prototype.error = null;

            /**
             * ModeChanged dataProvider.
             * @member {alg.live.DataProvider} dataProvider
             * @memberof alg.live.ModeChanged
             * @instance
             */
            ModeChanged.prototype.dataProvider = 0;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(ModeChanged.prototype, "_error", {
                get: $util.oneOfGetter($oneOfFields = ["error"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ModeChanged instance using the specified properties.
             * @function create
             * @memberof alg.live.ModeChanged
             * @static
             * @param {alg.live.IModeChanged=} [properties] Properties to set
             * @returns {alg.live.ModeChanged} ModeChanged instance
             */
            ModeChanged.create = function create(properties) {
                return new ModeChanged(properties);
            };

            /**
             * Encodes the specified ModeChanged message. Does not implicitly {@link alg.live.ModeChanged.verify|verify} messages.
             * @function encode
             * @memberof alg.live.ModeChanged
             * @static
             * @param {alg.live.IModeChanged} message ModeChanged message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ModeChanged.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.dataMode != null && Object.hasOwnProperty.call(message, "dataMode"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.dataMode);
                if (message.tradeMode != null && Object.hasOwnProperty.call(message, "tradeMode"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.tradeMode);
                if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.error);
                if (message.dataProvider != null && Object.hasOwnProperty.call(message, "dataProvider"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.dataProvider);
                return writer;
            };

            /**
             * Encodes the specified ModeChanged message, length delimited. Does not implicitly {@link alg.live.ModeChanged.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.ModeChanged
             * @static
             * @param {alg.live.IModeChanged} message ModeChanged message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ModeChanged.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ModeChanged message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.ModeChanged
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.ModeChanged} ModeChanged
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ModeChanged.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.ModeChanged();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.dataMode = reader.int32();
                            break;
                        }
                    case 2: {
                            message.tradeMode = reader.int32();
                            break;
                        }
                    case 3: {
                            message.error = reader.string();
                            break;
                        }
                    case 4: {
                            message.dataProvider = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ModeChanged message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.ModeChanged
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.ModeChanged} ModeChanged
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ModeChanged.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ModeChanged message.
             * @function verify
             * @memberof alg.live.ModeChanged
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ModeChanged.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.dataMode != null && message.hasOwnProperty("dataMode"))
                    switch (message.dataMode) {
                    default:
                        return "dataMode: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.tradeMode != null && message.hasOwnProperty("tradeMode"))
                    switch (message.tradeMode) {
                    default:
                        return "tradeMode: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.error != null && message.hasOwnProperty("error")) {
                    properties._error = 1;
                    if (!$util.isString(message.error))
                        return "error: string expected";
                }
                if (message.dataProvider != null && message.hasOwnProperty("dataProvider"))
                    switch (message.dataProvider) {
                    default:
                        return "dataProvider: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a ModeChanged message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.ModeChanged
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.ModeChanged} ModeChanged
             */
            ModeChanged.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.ModeChanged)
                    return object;
                let message = new $root.alg.live.ModeChanged();
                switch (object.dataMode) {
                default:
                    if (typeof object.dataMode === "number") {
                        message.dataMode = object.dataMode;
                        break;
                    }
                    break;
                case "DATA_MODE_UNKNOWN":
                case 0:
                    message.dataMode = 0;
                    break;
                case "DATA_MOCK":
                case 1:
                    message.dataMode = 1;
                    break;
                case "DATA_LIVE":
                case 2:
                    message.dataMode = 2;
                    break;
                }
                switch (object.tradeMode) {
                default:
                    if (typeof object.tradeMode === "number") {
                        message.tradeMode = object.tradeMode;
                        break;
                    }
                    break;
                case "TRADE_MODE_UNKNOWN":
                case 0:
                    message.tradeMode = 0;
                    break;
                case "TRADE_PAPER":
                case 1:
                    message.tradeMode = 1;
                    break;
                case "TRADE_LIVE":
                case 2:
                    message.tradeMode = 2;
                    break;
                }
                if (object.error != null)
                    message.error = String(object.error);
                switch (object.dataProvider) {
                default:
                    if (typeof object.dataProvider === "number") {
                        message.dataProvider = object.dataProvider;
                        break;
                    }
                    break;
                case "DATA_PROVIDER_NONE":
                case 0:
                    message.dataProvider = 0;
                    break;
                case "DATA_PROVIDER_RITHMIC":
                case 1:
                    message.dataProvider = 1;
                    break;
                case "DATA_PROVIDER_DATABENTO":
                case 2:
                    message.dataProvider = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a ModeChanged message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.ModeChanged
             * @static
             * @param {alg.live.ModeChanged} message ModeChanged
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ModeChanged.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.dataMode = options.enums === String ? "DATA_MODE_UNKNOWN" : 0;
                    object.tradeMode = options.enums === String ? "TRADE_MODE_UNKNOWN" : 0;
                    object.dataProvider = options.enums === String ? "DATA_PROVIDER_NONE" : 0;
                }
                if (message.dataMode != null && message.hasOwnProperty("dataMode"))
                    object.dataMode = options.enums === String ? $root.alg.live.DataMode[message.dataMode] === undefined ? message.dataMode : $root.alg.live.DataMode[message.dataMode] : message.dataMode;
                if (message.tradeMode != null && message.hasOwnProperty("tradeMode"))
                    object.tradeMode = options.enums === String ? $root.alg.live.TradeMode[message.tradeMode] === undefined ? message.tradeMode : $root.alg.live.TradeMode[message.tradeMode] : message.tradeMode;
                if (message.error != null && message.hasOwnProperty("error")) {
                    object.error = message.error;
                    if (options.oneofs)
                        object._error = "error";
                }
                if (message.dataProvider != null && message.hasOwnProperty("dataProvider"))
                    object.dataProvider = options.enums === String ? $root.alg.live.DataProvider[message.dataProvider] === undefined ? message.dataProvider : $root.alg.live.DataProvider[message.dataProvider] : message.dataProvider;
                return object;
            };

            /**
             * Converts this ModeChanged to JSON.
             * @function toJSON
             * @memberof alg.live.ModeChanged
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ModeChanged.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ModeChanged
             * @function getTypeUrl
             * @memberof alg.live.ModeChanged
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ModeChanged.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.ModeChanged";
            };

            return ModeChanged;
        })();

        live.SetUpdateInterval = (function() {

            /**
             * Properties of a SetUpdateInterval.
             * @memberof alg.live
             * @interface ISetUpdateInterval
             * @property {number|null} [intervalMs] SetUpdateInterval intervalMs
             */

            /**
             * Constructs a new SetUpdateInterval.
             * @memberof alg.live
             * @classdesc Represents a SetUpdateInterval.
             * @implements ISetUpdateInterval
             * @constructor
             * @param {alg.live.ISetUpdateInterval=} [properties] Properties to set
             */
            function SetUpdateInterval(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SetUpdateInterval intervalMs.
             * @member {number} intervalMs
             * @memberof alg.live.SetUpdateInterval
             * @instance
             */
            SetUpdateInterval.prototype.intervalMs = 0;

            /**
             * Creates a new SetUpdateInterval instance using the specified properties.
             * @function create
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {alg.live.ISetUpdateInterval=} [properties] Properties to set
             * @returns {alg.live.SetUpdateInterval} SetUpdateInterval instance
             */
            SetUpdateInterval.create = function create(properties) {
                return new SetUpdateInterval(properties);
            };

            /**
             * Encodes the specified SetUpdateInterval message. Does not implicitly {@link alg.live.SetUpdateInterval.verify|verify} messages.
             * @function encode
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {alg.live.ISetUpdateInterval} message SetUpdateInterval message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetUpdateInterval.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.intervalMs != null && Object.hasOwnProperty.call(message, "intervalMs"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.intervalMs);
                return writer;
            };

            /**
             * Encodes the specified SetUpdateInterval message, length delimited. Does not implicitly {@link alg.live.SetUpdateInterval.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {alg.live.ISetUpdateInterval} message SetUpdateInterval message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetUpdateInterval.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SetUpdateInterval message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.SetUpdateInterval} SetUpdateInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetUpdateInterval.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.SetUpdateInterval();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.intervalMs = reader.uint32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SetUpdateInterval message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.SetUpdateInterval} SetUpdateInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetUpdateInterval.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SetUpdateInterval message.
             * @function verify
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SetUpdateInterval.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.intervalMs != null && message.hasOwnProperty("intervalMs"))
                    if (!$util.isInteger(message.intervalMs))
                        return "intervalMs: integer expected";
                return null;
            };

            /**
             * Creates a SetUpdateInterval message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.SetUpdateInterval} SetUpdateInterval
             */
            SetUpdateInterval.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.SetUpdateInterval)
                    return object;
                let message = new $root.alg.live.SetUpdateInterval();
                if (object.intervalMs != null)
                    message.intervalMs = object.intervalMs >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a SetUpdateInterval message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {alg.live.SetUpdateInterval} message SetUpdateInterval
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SetUpdateInterval.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.intervalMs = 0;
                if (message.intervalMs != null && message.hasOwnProperty("intervalMs"))
                    object.intervalMs = message.intervalMs;
                return object;
            };

            /**
             * Converts this SetUpdateInterval to JSON.
             * @function toJSON
             * @memberof alg.live.SetUpdateInterval
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SetUpdateInterval.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SetUpdateInterval
             * @function getTypeUrl
             * @memberof alg.live.SetUpdateInterval
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SetUpdateInterval.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.SetUpdateInterval";
            };

            return SetUpdateInterval;
        })();

        live.SetDepthConfig = (function() {

            /**
             * Properties of a SetDepthConfig.
             * @memberof alg.live
             * @interface ISetDepthConfig
             * @property {number|null} [depthIntervalMs] SetDepthConfig depthIntervalMs
             */

            /**
             * Constructs a new SetDepthConfig.
             * @memberof alg.live
             * @classdesc Represents a SetDepthConfig.
             * @implements ISetDepthConfig
             * @constructor
             * @param {alg.live.ISetDepthConfig=} [properties] Properties to set
             */
            function SetDepthConfig(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SetDepthConfig depthIntervalMs.
             * @member {number} depthIntervalMs
             * @memberof alg.live.SetDepthConfig
             * @instance
             */
            SetDepthConfig.prototype.depthIntervalMs = 0;

            /**
             * Creates a new SetDepthConfig instance using the specified properties.
             * @function create
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {alg.live.ISetDepthConfig=} [properties] Properties to set
             * @returns {alg.live.SetDepthConfig} SetDepthConfig instance
             */
            SetDepthConfig.create = function create(properties) {
                return new SetDepthConfig(properties);
            };

            /**
             * Encodes the specified SetDepthConfig message. Does not implicitly {@link alg.live.SetDepthConfig.verify|verify} messages.
             * @function encode
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {alg.live.ISetDepthConfig} message SetDepthConfig message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetDepthConfig.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.depthIntervalMs != null && Object.hasOwnProperty.call(message, "depthIntervalMs"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.depthIntervalMs);
                return writer;
            };

            /**
             * Encodes the specified SetDepthConfig message, length delimited. Does not implicitly {@link alg.live.SetDepthConfig.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {alg.live.ISetDepthConfig} message SetDepthConfig message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SetDepthConfig.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SetDepthConfig message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.SetDepthConfig} SetDepthConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetDepthConfig.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.SetDepthConfig();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.depthIntervalMs = reader.uint32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SetDepthConfig message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.SetDepthConfig} SetDepthConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SetDepthConfig.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SetDepthConfig message.
             * @function verify
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SetDepthConfig.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.depthIntervalMs != null && message.hasOwnProperty("depthIntervalMs"))
                    if (!$util.isInteger(message.depthIntervalMs))
                        return "depthIntervalMs: integer expected";
                return null;
            };

            /**
             * Creates a SetDepthConfig message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.SetDepthConfig} SetDepthConfig
             */
            SetDepthConfig.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.SetDepthConfig)
                    return object;
                let message = new $root.alg.live.SetDepthConfig();
                if (object.depthIntervalMs != null)
                    message.depthIntervalMs = object.depthIntervalMs >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a SetDepthConfig message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {alg.live.SetDepthConfig} message SetDepthConfig
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SetDepthConfig.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.depthIntervalMs = 0;
                if (message.depthIntervalMs != null && message.hasOwnProperty("depthIntervalMs"))
                    object.depthIntervalMs = message.depthIntervalMs;
                return object;
            };

            /**
             * Converts this SetDepthConfig to JSON.
             * @function toJSON
             * @memberof alg.live.SetDepthConfig
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SetDepthConfig.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SetDepthConfig
             * @function getTypeUrl
             * @memberof alg.live.SetDepthConfig
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SetDepthConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.SetDepthConfig";
            };

            return SetDepthConfig;
        })();

        live.ConnectionStatus = (function() {

            /**
             * Properties of a ConnectionStatus.
             * @memberof alg.live
             * @interface IConnectionStatus
             * @property {alg.live.DataMode|null} [dataMode] ConnectionStatus dataMode
             * @property {alg.live.TradeMode|null} [tradeMode] ConnectionStatus tradeMode
             * @property {boolean|null} [connected] ConnectionStatus connected
             * @property {number|Long|null} [feedLatencyUs] ConnectionStatus feedLatencyUs
             * @property {alg.live.DataProvider|null} [dataProvider] ConnectionStatus dataProvider
             */

            /**
             * Constructs a new ConnectionStatus.
             * @memberof alg.live
             * @classdesc Represents a ConnectionStatus.
             * @implements IConnectionStatus
             * @constructor
             * @param {alg.live.IConnectionStatus=} [properties] Properties to set
             */
            function ConnectionStatus(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConnectionStatus dataMode.
             * @member {alg.live.DataMode} dataMode
             * @memberof alg.live.ConnectionStatus
             * @instance
             */
            ConnectionStatus.prototype.dataMode = 0;

            /**
             * ConnectionStatus tradeMode.
             * @member {alg.live.TradeMode} tradeMode
             * @memberof alg.live.ConnectionStatus
             * @instance
             */
            ConnectionStatus.prototype.tradeMode = 0;

            /**
             * ConnectionStatus connected.
             * @member {boolean} connected
             * @memberof alg.live.ConnectionStatus
             * @instance
             */
            ConnectionStatus.prototype.connected = false;

            /**
             * ConnectionStatus feedLatencyUs.
             * @member {number|Long|null|undefined} feedLatencyUs
             * @memberof alg.live.ConnectionStatus
             * @instance
             */
            ConnectionStatus.prototype.feedLatencyUs = null;

            /**
             * ConnectionStatus dataProvider.
             * @member {alg.live.DataProvider} dataProvider
             * @memberof alg.live.ConnectionStatus
             * @instance
             */
            ConnectionStatus.prototype.dataProvider = 0;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(ConnectionStatus.prototype, "_feedLatencyUs", {
                get: $util.oneOfGetter($oneOfFields = ["feedLatencyUs"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ConnectionStatus instance using the specified properties.
             * @function create
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {alg.live.IConnectionStatus=} [properties] Properties to set
             * @returns {alg.live.ConnectionStatus} ConnectionStatus instance
             */
            ConnectionStatus.create = function create(properties) {
                return new ConnectionStatus(properties);
            };

            /**
             * Encodes the specified ConnectionStatus message. Does not implicitly {@link alg.live.ConnectionStatus.verify|verify} messages.
             * @function encode
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {alg.live.IConnectionStatus} message ConnectionStatus message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConnectionStatus.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.dataMode != null && Object.hasOwnProperty.call(message, "dataMode"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.dataMode);
                if (message.tradeMode != null && Object.hasOwnProperty.call(message, "tradeMode"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.tradeMode);
                if (message.connected != null && Object.hasOwnProperty.call(message, "connected"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.connected);
                if (message.feedLatencyUs != null && Object.hasOwnProperty.call(message, "feedLatencyUs"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.feedLatencyUs);
                if (message.dataProvider != null && Object.hasOwnProperty.call(message, "dataProvider"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.dataProvider);
                return writer;
            };

            /**
             * Encodes the specified ConnectionStatus message, length delimited. Does not implicitly {@link alg.live.ConnectionStatus.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {alg.live.IConnectionStatus} message ConnectionStatus message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConnectionStatus.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ConnectionStatus message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.ConnectionStatus} ConnectionStatus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConnectionStatus.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.ConnectionStatus();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.dataMode = reader.int32();
                            break;
                        }
                    case 2: {
                            message.tradeMode = reader.int32();
                            break;
                        }
                    case 3: {
                            message.connected = reader.bool();
                            break;
                        }
                    case 4: {
                            message.feedLatencyUs = reader.int64();
                            break;
                        }
                    case 5: {
                            message.dataProvider = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ConnectionStatus message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.ConnectionStatus} ConnectionStatus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConnectionStatus.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConnectionStatus message.
             * @function verify
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConnectionStatus.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.dataMode != null && message.hasOwnProperty("dataMode"))
                    switch (message.dataMode) {
                    default:
                        return "dataMode: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.tradeMode != null && message.hasOwnProperty("tradeMode"))
                    switch (message.tradeMode) {
                    default:
                        return "tradeMode: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.connected != null && message.hasOwnProperty("connected"))
                    if (typeof message.connected !== "boolean")
                        return "connected: boolean expected";
                if (message.feedLatencyUs != null && message.hasOwnProperty("feedLatencyUs")) {
                    properties._feedLatencyUs = 1;
                    if (!$util.isInteger(message.feedLatencyUs) && !(message.feedLatencyUs && $util.isInteger(message.feedLatencyUs.low) && $util.isInteger(message.feedLatencyUs.high)))
                        return "feedLatencyUs: integer|Long expected";
                }
                if (message.dataProvider != null && message.hasOwnProperty("dataProvider"))
                    switch (message.dataProvider) {
                    default:
                        return "dataProvider: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a ConnectionStatus message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.ConnectionStatus} ConnectionStatus
             */
            ConnectionStatus.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.ConnectionStatus)
                    return object;
                let message = new $root.alg.live.ConnectionStatus();
                switch (object.dataMode) {
                default:
                    if (typeof object.dataMode === "number") {
                        message.dataMode = object.dataMode;
                        break;
                    }
                    break;
                case "DATA_MODE_UNKNOWN":
                case 0:
                    message.dataMode = 0;
                    break;
                case "DATA_MOCK":
                case 1:
                    message.dataMode = 1;
                    break;
                case "DATA_LIVE":
                case 2:
                    message.dataMode = 2;
                    break;
                }
                switch (object.tradeMode) {
                default:
                    if (typeof object.tradeMode === "number") {
                        message.tradeMode = object.tradeMode;
                        break;
                    }
                    break;
                case "TRADE_MODE_UNKNOWN":
                case 0:
                    message.tradeMode = 0;
                    break;
                case "TRADE_PAPER":
                case 1:
                    message.tradeMode = 1;
                    break;
                case "TRADE_LIVE":
                case 2:
                    message.tradeMode = 2;
                    break;
                }
                if (object.connected != null)
                    message.connected = Boolean(object.connected);
                if (object.feedLatencyUs != null)
                    if ($util.Long)
                        (message.feedLatencyUs = $util.Long.fromValue(object.feedLatencyUs)).unsigned = false;
                    else if (typeof object.feedLatencyUs === "string")
                        message.feedLatencyUs = parseInt(object.feedLatencyUs, 10);
                    else if (typeof object.feedLatencyUs === "number")
                        message.feedLatencyUs = object.feedLatencyUs;
                    else if (typeof object.feedLatencyUs === "object")
                        message.feedLatencyUs = new $util.LongBits(object.feedLatencyUs.low >>> 0, object.feedLatencyUs.high >>> 0).toNumber();
                switch (object.dataProvider) {
                default:
                    if (typeof object.dataProvider === "number") {
                        message.dataProvider = object.dataProvider;
                        break;
                    }
                    break;
                case "DATA_PROVIDER_NONE":
                case 0:
                    message.dataProvider = 0;
                    break;
                case "DATA_PROVIDER_RITHMIC":
                case 1:
                    message.dataProvider = 1;
                    break;
                case "DATA_PROVIDER_DATABENTO":
                case 2:
                    message.dataProvider = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a ConnectionStatus message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {alg.live.ConnectionStatus} message ConnectionStatus
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConnectionStatus.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.dataMode = options.enums === String ? "DATA_MODE_UNKNOWN" : 0;
                    object.tradeMode = options.enums === String ? "TRADE_MODE_UNKNOWN" : 0;
                    object.connected = false;
                    object.dataProvider = options.enums === String ? "DATA_PROVIDER_NONE" : 0;
                }
                if (message.dataMode != null && message.hasOwnProperty("dataMode"))
                    object.dataMode = options.enums === String ? $root.alg.live.DataMode[message.dataMode] === undefined ? message.dataMode : $root.alg.live.DataMode[message.dataMode] : message.dataMode;
                if (message.tradeMode != null && message.hasOwnProperty("tradeMode"))
                    object.tradeMode = options.enums === String ? $root.alg.live.TradeMode[message.tradeMode] === undefined ? message.tradeMode : $root.alg.live.TradeMode[message.tradeMode] : message.tradeMode;
                if (message.connected != null && message.hasOwnProperty("connected"))
                    object.connected = message.connected;
                if (message.feedLatencyUs != null && message.hasOwnProperty("feedLatencyUs")) {
                    if (typeof message.feedLatencyUs === "number")
                        object.feedLatencyUs = options.longs === String ? String(message.feedLatencyUs) : message.feedLatencyUs;
                    else
                        object.feedLatencyUs = options.longs === String ? $util.Long.prototype.toString.call(message.feedLatencyUs) : options.longs === Number ? new $util.LongBits(message.feedLatencyUs.low >>> 0, message.feedLatencyUs.high >>> 0).toNumber() : message.feedLatencyUs;
                    if (options.oneofs)
                        object._feedLatencyUs = "feedLatencyUs";
                }
                if (message.dataProvider != null && message.hasOwnProperty("dataProvider"))
                    object.dataProvider = options.enums === String ? $root.alg.live.DataProvider[message.dataProvider] === undefined ? message.dataProvider : $root.alg.live.DataProvider[message.dataProvider] : message.dataProvider;
                return object;
            };

            /**
             * Converts this ConnectionStatus to JSON.
             * @function toJSON
             * @memberof alg.live.ConnectionStatus
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConnectionStatus.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConnectionStatus
             * @function getTypeUrl
             * @memberof alg.live.ConnectionStatus
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConnectionStatus.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.ConnectionStatus";
            };

            return ConnectionStatus;
        })();

        live.Capabilities = (function() {

            /**
             * Properties of a Capabilities.
             * @memberof alg.live
             * @interface ICapabilities
             * @property {boolean|null} [mockEnabled] Capabilities mockEnabled
             * @property {boolean|null} [rithmicEnabled] Capabilities rithmicEnabled
             * @property {boolean|null} [tradingEnabled] Capabilities tradingEnabled
             * @property {Array.<string>|null} [availableBrokers] Capabilities availableBrokers
             * @property {Object.<string,boolean>|null} [userHasCredentials] Capabilities userHasCredentials
             * @property {boolean|null} [databentoEnabled] Capabilities databentoEnabled
             */

            /**
             * Constructs a new Capabilities.
             * @memberof alg.live
             * @classdesc Represents a Capabilities.
             * @implements ICapabilities
             * @constructor
             * @param {alg.live.ICapabilities=} [properties] Properties to set
             */
            function Capabilities(properties) {
                this.availableBrokers = [];
                this.userHasCredentials = {};
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Capabilities mockEnabled.
             * @member {boolean} mockEnabled
             * @memberof alg.live.Capabilities
             * @instance
             */
            Capabilities.prototype.mockEnabled = false;

            /**
             * Capabilities rithmicEnabled.
             * @member {boolean} rithmicEnabled
             * @memberof alg.live.Capabilities
             * @instance
             */
            Capabilities.prototype.rithmicEnabled = false;

            /**
             * Capabilities tradingEnabled.
             * @member {boolean} tradingEnabled
             * @memberof alg.live.Capabilities
             * @instance
             */
            Capabilities.prototype.tradingEnabled = false;

            /**
             * Capabilities availableBrokers.
             * @member {Array.<string>} availableBrokers
             * @memberof alg.live.Capabilities
             * @instance
             */
            Capabilities.prototype.availableBrokers = $util.emptyArray;

            /**
             * Capabilities userHasCredentials.
             * @member {Object.<string,boolean>} userHasCredentials
             * @memberof alg.live.Capabilities
             * @instance
             */
            Capabilities.prototype.userHasCredentials = $util.emptyObject;

            /**
             * Capabilities databentoEnabled.
             * @member {boolean} databentoEnabled
             * @memberof alg.live.Capabilities
             * @instance
             */
            Capabilities.prototype.databentoEnabled = false;

            /**
             * Creates a new Capabilities instance using the specified properties.
             * @function create
             * @memberof alg.live.Capabilities
             * @static
             * @param {alg.live.ICapabilities=} [properties] Properties to set
             * @returns {alg.live.Capabilities} Capabilities instance
             */
            Capabilities.create = function create(properties) {
                return new Capabilities(properties);
            };

            /**
             * Encodes the specified Capabilities message. Does not implicitly {@link alg.live.Capabilities.verify|verify} messages.
             * @function encode
             * @memberof alg.live.Capabilities
             * @static
             * @param {alg.live.ICapabilities} message Capabilities message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Capabilities.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.mockEnabled != null && Object.hasOwnProperty.call(message, "mockEnabled"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.mockEnabled);
                if (message.rithmicEnabled != null && Object.hasOwnProperty.call(message, "rithmicEnabled"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.rithmicEnabled);
                if (message.tradingEnabled != null && Object.hasOwnProperty.call(message, "tradingEnabled"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.tradingEnabled);
                if (message.availableBrokers != null && message.availableBrokers.length)
                    for (let i = 0; i < message.availableBrokers.length; ++i)
                        writer.uint32(/* id 4, wireType 2 =*/34).string(message.availableBrokers[i]);
                if (message.userHasCredentials != null && Object.hasOwnProperty.call(message, "userHasCredentials"))
                    for (let keys = Object.keys(message.userHasCredentials), i = 0; i < keys.length; ++i)
                        writer.uint32(/* id 5, wireType 2 =*/42).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 0 =*/16).bool(message.userHasCredentials[keys[i]]).ldelim();
                if (message.databentoEnabled != null && Object.hasOwnProperty.call(message, "databentoEnabled"))
                    writer.uint32(/* id 6, wireType 0 =*/48).bool(message.databentoEnabled);
                return writer;
            };

            /**
             * Encodes the specified Capabilities message, length delimited. Does not implicitly {@link alg.live.Capabilities.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.Capabilities
             * @static
             * @param {alg.live.ICapabilities} message Capabilities message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Capabilities.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Capabilities message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.Capabilities
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.Capabilities} Capabilities
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Capabilities.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.Capabilities(), key, value;
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.mockEnabled = reader.bool();
                            break;
                        }
                    case 2: {
                            message.rithmicEnabled = reader.bool();
                            break;
                        }
                    case 3: {
                            message.tradingEnabled = reader.bool();
                            break;
                        }
                    case 4: {
                            if (!(message.availableBrokers && message.availableBrokers.length))
                                message.availableBrokers = [];
                            message.availableBrokers.push(reader.string());
                            break;
                        }
                    case 5: {
                            if (message.userHasCredentials === $util.emptyObject)
                                message.userHasCredentials = {};
                            let end2 = reader.uint32() + reader.pos;
                            key = "";
                            value = false;
                            while (reader.pos < end2) {
                                let tag2 = reader.uint32();
                                switch (tag2 >>> 3) {
                                case 1:
                                    key = reader.string();
                                    break;
                                case 2:
                                    value = reader.bool();
                                    break;
                                default:
                                    reader.skipType(tag2 & 7);
                                    break;
                                }
                            }
                            message.userHasCredentials[key] = value;
                            break;
                        }
                    case 6: {
                            message.databentoEnabled = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Capabilities message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.Capabilities
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.Capabilities} Capabilities
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Capabilities.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Capabilities message.
             * @function verify
             * @memberof alg.live.Capabilities
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Capabilities.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.mockEnabled != null && message.hasOwnProperty("mockEnabled"))
                    if (typeof message.mockEnabled !== "boolean")
                        return "mockEnabled: boolean expected";
                if (message.rithmicEnabled != null && message.hasOwnProperty("rithmicEnabled"))
                    if (typeof message.rithmicEnabled !== "boolean")
                        return "rithmicEnabled: boolean expected";
                if (message.tradingEnabled != null && message.hasOwnProperty("tradingEnabled"))
                    if (typeof message.tradingEnabled !== "boolean")
                        return "tradingEnabled: boolean expected";
                if (message.availableBrokers != null && message.hasOwnProperty("availableBrokers")) {
                    if (!Array.isArray(message.availableBrokers))
                        return "availableBrokers: array expected";
                    for (let i = 0; i < message.availableBrokers.length; ++i)
                        if (!$util.isString(message.availableBrokers[i]))
                            return "availableBrokers: string[] expected";
                }
                if (message.userHasCredentials != null && message.hasOwnProperty("userHasCredentials")) {
                    if (!$util.isObject(message.userHasCredentials))
                        return "userHasCredentials: object expected";
                    let key = Object.keys(message.userHasCredentials);
                    for (let i = 0; i < key.length; ++i)
                        if (typeof message.userHasCredentials[key[i]] !== "boolean")
                            return "userHasCredentials: boolean{k:string} expected";
                }
                if (message.databentoEnabled != null && message.hasOwnProperty("databentoEnabled"))
                    if (typeof message.databentoEnabled !== "boolean")
                        return "databentoEnabled: boolean expected";
                return null;
            };

            /**
             * Creates a Capabilities message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.Capabilities
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.Capabilities} Capabilities
             */
            Capabilities.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.Capabilities)
                    return object;
                let message = new $root.alg.live.Capabilities();
                if (object.mockEnabled != null)
                    message.mockEnabled = Boolean(object.mockEnabled);
                if (object.rithmicEnabled != null)
                    message.rithmicEnabled = Boolean(object.rithmicEnabled);
                if (object.tradingEnabled != null)
                    message.tradingEnabled = Boolean(object.tradingEnabled);
                if (object.availableBrokers) {
                    if (!Array.isArray(object.availableBrokers))
                        throw TypeError(".alg.live.Capabilities.availableBrokers: array expected");
                    message.availableBrokers = [];
                    for (let i = 0; i < object.availableBrokers.length; ++i)
                        message.availableBrokers[i] = String(object.availableBrokers[i]);
                }
                if (object.userHasCredentials) {
                    if (typeof object.userHasCredentials !== "object")
                        throw TypeError(".alg.live.Capabilities.userHasCredentials: object expected");
                    message.userHasCredentials = {};
                    for (let keys = Object.keys(object.userHasCredentials), i = 0; i < keys.length; ++i)
                        message.userHasCredentials[keys[i]] = Boolean(object.userHasCredentials[keys[i]]);
                }
                if (object.databentoEnabled != null)
                    message.databentoEnabled = Boolean(object.databentoEnabled);
                return message;
            };

            /**
             * Creates a plain object from a Capabilities message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.Capabilities
             * @static
             * @param {alg.live.Capabilities} message Capabilities
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Capabilities.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.availableBrokers = [];
                if (options.objects || options.defaults)
                    object.userHasCredentials = {};
                if (options.defaults) {
                    object.mockEnabled = false;
                    object.rithmicEnabled = false;
                    object.tradingEnabled = false;
                    object.databentoEnabled = false;
                }
                if (message.mockEnabled != null && message.hasOwnProperty("mockEnabled"))
                    object.mockEnabled = message.mockEnabled;
                if (message.rithmicEnabled != null && message.hasOwnProperty("rithmicEnabled"))
                    object.rithmicEnabled = message.rithmicEnabled;
                if (message.tradingEnabled != null && message.hasOwnProperty("tradingEnabled"))
                    object.tradingEnabled = message.tradingEnabled;
                if (message.availableBrokers && message.availableBrokers.length) {
                    object.availableBrokers = [];
                    for (let j = 0; j < message.availableBrokers.length; ++j)
                        object.availableBrokers[j] = message.availableBrokers[j];
                }
                let keys2;
                if (message.userHasCredentials && (keys2 = Object.keys(message.userHasCredentials)).length) {
                    object.userHasCredentials = {};
                    for (let j = 0; j < keys2.length; ++j)
                        object.userHasCredentials[keys2[j]] = message.userHasCredentials[keys2[j]];
                }
                if (message.databentoEnabled != null && message.hasOwnProperty("databentoEnabled"))
                    object.databentoEnabled = message.databentoEnabled;
                return object;
            };

            /**
             * Converts this Capabilities to JSON.
             * @function toJSON
             * @memberof alg.live.Capabilities
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Capabilities.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Capabilities
             * @function getTypeUrl
             * @memberof alg.live.Capabilities
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Capabilities.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.Capabilities";
            };

            return Capabilities;
        })();

        live.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof alg.live
             * @interface IError
             * @property {string|null} [code] Error code
             * @property {string|null} [message] Error message
             * @property {string|null} [requestId] Error requestId
             */

            /**
             * Constructs a new Error.
             * @memberof alg.live
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {alg.live.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {string} code
             * @memberof alg.live.Error
             * @instance
             */
            Error.prototype.code = "";

            /**
             * Error message.
             * @member {string} message
             * @memberof alg.live.Error
             * @instance
             */
            Error.prototype.message = "";

            /**
             * Error requestId.
             * @member {string|null|undefined} requestId
             * @memberof alg.live.Error
             * @instance
             */
            Error.prototype.requestId = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            // Virtual OneOf for proto3 optional field
            Object.defineProperty(Error.prototype, "_requestId", {
                get: $util.oneOfGetter($oneOfFields = ["requestId"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof alg.live.Error
             * @static
             * @param {alg.live.IError=} [properties] Properties to set
             * @returns {alg.live.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link alg.live.Error.verify|verify} messages.
             * @function encode
             * @memberof alg.live.Error
             * @static
             * @param {alg.live.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.code);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                if (message.requestId != null && Object.hasOwnProperty.call(message, "requestId"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.requestId);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link alg.live.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.Error
             * @static
             * @param {alg.live.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.Error();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.code = reader.string();
                            break;
                        }
                    case 2: {
                            message.message = reader.string();
                            break;
                        }
                    case 3: {
                            message.requestId = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Error message.
             * @function verify
             * @memberof alg.live.Error
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Error.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.code != null && message.hasOwnProperty("code"))
                    if (!$util.isString(message.code))
                        return "code: string expected";
                if (message.message != null && message.hasOwnProperty("message"))
                    if (!$util.isString(message.message))
                        return "message: string expected";
                if (message.requestId != null && message.hasOwnProperty("requestId")) {
                    properties._requestId = 1;
                    if (!$util.isString(message.requestId))
                        return "requestId: string expected";
                }
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.Error)
                    return object;
                let message = new $root.alg.live.Error();
                if (object.code != null)
                    message.code = String(object.code);
                if (object.message != null)
                    message.message = String(object.message);
                if (object.requestId != null)
                    message.requestId = String(object.requestId);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.Error
             * @static
             * @param {alg.live.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.code = "";
                    object.message = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = message.code;
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                if (message.requestId != null && message.hasOwnProperty("requestId")) {
                    object.requestId = message.requestId;
                    if (options.oneofs)
                        object._requestId = "requestId";
                }
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof alg.live.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Error
             * @function getTypeUrl
             * @memberof alg.live.Error
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Error.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.Error";
            };

            return Error;
        })();

        live.ClientMessage = (function() {

            /**
             * Properties of a ClientMessage.
             * @memberof alg.live
             * @interface IClientMessage
             * @property {alg.live.ISubscribe|null} [subscribe] ClientMessage subscribe
             * @property {alg.live.IUnsubscribe|null} [unsubscribe] ClientMessage unsubscribe
             * @property {alg.live.ISearchSymbols|null} [searchSymbols] ClientMessage searchSymbols
             * @property {alg.live.IPlaceOrder|null} [placeOrder] ClientMessage placeOrder
             * @property {alg.live.IPlaceBracket|null} [placeBracket] ClientMessage placeBracket
             * @property {alg.live.IModifyOrder|null} [modifyOrder] ClientMessage modifyOrder
             * @property {alg.live.ICancelOrder|null} [cancelOrder] ClientMessage cancelOrder
             * @property {alg.live.ISetUpdateInterval|null} [setUpdateInterval] ClientMessage setUpdateInterval
             * @property {alg.live.ISetMode|null} [setMode] ClientMessage setMode
             * @property {alg.live.ISetDepthConfig|null} [setDepthConfig] ClientMessage setDepthConfig
             */

            /**
             * Constructs a new ClientMessage.
             * @memberof alg.live
             * @classdesc Represents a ClientMessage.
             * @implements IClientMessage
             * @constructor
             * @param {alg.live.IClientMessage=} [properties] Properties to set
             */
            function ClientMessage(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ClientMessage subscribe.
             * @member {alg.live.ISubscribe|null|undefined} subscribe
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.subscribe = null;

            /**
             * ClientMessage unsubscribe.
             * @member {alg.live.IUnsubscribe|null|undefined} unsubscribe
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.unsubscribe = null;

            /**
             * ClientMessage searchSymbols.
             * @member {alg.live.ISearchSymbols|null|undefined} searchSymbols
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.searchSymbols = null;

            /**
             * ClientMessage placeOrder.
             * @member {alg.live.IPlaceOrder|null|undefined} placeOrder
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.placeOrder = null;

            /**
             * ClientMessage placeBracket.
             * @member {alg.live.IPlaceBracket|null|undefined} placeBracket
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.placeBracket = null;

            /**
             * ClientMessage modifyOrder.
             * @member {alg.live.IModifyOrder|null|undefined} modifyOrder
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.modifyOrder = null;

            /**
             * ClientMessage cancelOrder.
             * @member {alg.live.ICancelOrder|null|undefined} cancelOrder
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.cancelOrder = null;

            /**
             * ClientMessage setUpdateInterval.
             * @member {alg.live.ISetUpdateInterval|null|undefined} setUpdateInterval
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.setUpdateInterval = null;

            /**
             * ClientMessage setMode.
             * @member {alg.live.ISetMode|null|undefined} setMode
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.setMode = null;

            /**
             * ClientMessage setDepthConfig.
             * @member {alg.live.ISetDepthConfig|null|undefined} setDepthConfig
             * @memberof alg.live.ClientMessage
             * @instance
             */
            ClientMessage.prototype.setDepthConfig = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * ClientMessage payload.
             * @member {"subscribe"|"unsubscribe"|"searchSymbols"|"placeOrder"|"placeBracket"|"modifyOrder"|"cancelOrder"|"setUpdateInterval"|"setMode"|"setDepthConfig"|undefined} payload
             * @memberof alg.live.ClientMessage
             * @instance
             */
            Object.defineProperty(ClientMessage.prototype, "payload", {
                get: $util.oneOfGetter($oneOfFields = ["subscribe", "unsubscribe", "searchSymbols", "placeOrder", "placeBracket", "modifyOrder", "cancelOrder", "setUpdateInterval", "setMode", "setDepthConfig"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ClientMessage instance using the specified properties.
             * @function create
             * @memberof alg.live.ClientMessage
             * @static
             * @param {alg.live.IClientMessage=} [properties] Properties to set
             * @returns {alg.live.ClientMessage} ClientMessage instance
             */
            ClientMessage.create = function create(properties) {
                return new ClientMessage(properties);
            };

            /**
             * Encodes the specified ClientMessage message. Does not implicitly {@link alg.live.ClientMessage.verify|verify} messages.
             * @function encode
             * @memberof alg.live.ClientMessage
             * @static
             * @param {alg.live.IClientMessage} message ClientMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClientMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.subscribe != null && Object.hasOwnProperty.call(message, "subscribe"))
                    $root.alg.live.Subscribe.encode(message.subscribe, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.unsubscribe != null && Object.hasOwnProperty.call(message, "unsubscribe"))
                    $root.alg.live.Unsubscribe.encode(message.unsubscribe, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.placeOrder != null && Object.hasOwnProperty.call(message, "placeOrder"))
                    $root.alg.live.PlaceOrder.encode(message.placeOrder, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.placeBracket != null && Object.hasOwnProperty.call(message, "placeBracket"))
                    $root.alg.live.PlaceBracket.encode(message.placeBracket, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.modifyOrder != null && Object.hasOwnProperty.call(message, "modifyOrder"))
                    $root.alg.live.ModifyOrder.encode(message.modifyOrder, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.cancelOrder != null && Object.hasOwnProperty.call(message, "cancelOrder"))
                    $root.alg.live.CancelOrder.encode(message.cancelOrder, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.setUpdateInterval != null && Object.hasOwnProperty.call(message, "setUpdateInterval"))
                    $root.alg.live.SetUpdateInterval.encode(message.setUpdateInterval, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.setMode != null && Object.hasOwnProperty.call(message, "setMode"))
                    $root.alg.live.SetMode.encode(message.setMode, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.searchSymbols != null && Object.hasOwnProperty.call(message, "searchSymbols"))
                    $root.alg.live.SearchSymbols.encode(message.searchSymbols, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                if (message.setDepthConfig != null && Object.hasOwnProperty.call(message, "setDepthConfig"))
                    $root.alg.live.SetDepthConfig.encode(message.setDepthConfig, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ClientMessage message, length delimited. Does not implicitly {@link alg.live.ClientMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.ClientMessage
             * @static
             * @param {alg.live.IClientMessage} message ClientMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClientMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ClientMessage message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.ClientMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.ClientMessage} ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClientMessage.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.ClientMessage();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.subscribe = $root.alg.live.Subscribe.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.unsubscribe = $root.alg.live.Unsubscribe.decode(reader, reader.uint32());
                            break;
                        }
                    case 9: {
                            message.searchSymbols = $root.alg.live.SearchSymbols.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.placeOrder = $root.alg.live.PlaceOrder.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.placeBracket = $root.alg.live.PlaceBracket.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.modifyOrder = $root.alg.live.ModifyOrder.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.cancelOrder = $root.alg.live.CancelOrder.decode(reader, reader.uint32());
                            break;
                        }
                    case 7: {
                            message.setUpdateInterval = $root.alg.live.SetUpdateInterval.decode(reader, reader.uint32());
                            break;
                        }
                    case 8: {
                            message.setMode = $root.alg.live.SetMode.decode(reader, reader.uint32());
                            break;
                        }
                    case 10: {
                            message.setDepthConfig = $root.alg.live.SetDepthConfig.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ClientMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.ClientMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.ClientMessage} ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClientMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ClientMessage message.
             * @function verify
             * @memberof alg.live.ClientMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ClientMessage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.subscribe != null && message.hasOwnProperty("subscribe")) {
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.Subscribe.verify(message.subscribe);
                        if (error)
                            return "subscribe." + error;
                    }
                }
                if (message.unsubscribe != null && message.hasOwnProperty("unsubscribe")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.Unsubscribe.verify(message.unsubscribe);
                        if (error)
                            return "unsubscribe." + error;
                    }
                }
                if (message.searchSymbols != null && message.hasOwnProperty("searchSymbols")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.SearchSymbols.verify(message.searchSymbols);
                        if (error)
                            return "searchSymbols." + error;
                    }
                }
                if (message.placeOrder != null && message.hasOwnProperty("placeOrder")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.PlaceOrder.verify(message.placeOrder);
                        if (error)
                            return "placeOrder." + error;
                    }
                }
                if (message.placeBracket != null && message.hasOwnProperty("placeBracket")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.PlaceBracket.verify(message.placeBracket);
                        if (error)
                            return "placeBracket." + error;
                    }
                }
                if (message.modifyOrder != null && message.hasOwnProperty("modifyOrder")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.ModifyOrder.verify(message.modifyOrder);
                        if (error)
                            return "modifyOrder." + error;
                    }
                }
                if (message.cancelOrder != null && message.hasOwnProperty("cancelOrder")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.CancelOrder.verify(message.cancelOrder);
                        if (error)
                            return "cancelOrder." + error;
                    }
                }
                if (message.setUpdateInterval != null && message.hasOwnProperty("setUpdateInterval")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.SetUpdateInterval.verify(message.setUpdateInterval);
                        if (error)
                            return "setUpdateInterval." + error;
                    }
                }
                if (message.setMode != null && message.hasOwnProperty("setMode")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.SetMode.verify(message.setMode);
                        if (error)
                            return "setMode." + error;
                    }
                }
                if (message.setDepthConfig != null && message.hasOwnProperty("setDepthConfig")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.SetDepthConfig.verify(message.setDepthConfig);
                        if (error)
                            return "setDepthConfig." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ClientMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.ClientMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.ClientMessage} ClientMessage
             */
            ClientMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.ClientMessage)
                    return object;
                let message = new $root.alg.live.ClientMessage();
                if (object.subscribe != null) {
                    if (typeof object.subscribe !== "object")
                        throw TypeError(".alg.live.ClientMessage.subscribe: object expected");
                    message.subscribe = $root.alg.live.Subscribe.fromObject(object.subscribe);
                }
                if (object.unsubscribe != null) {
                    if (typeof object.unsubscribe !== "object")
                        throw TypeError(".alg.live.ClientMessage.unsubscribe: object expected");
                    message.unsubscribe = $root.alg.live.Unsubscribe.fromObject(object.unsubscribe);
                }
                if (object.searchSymbols != null) {
                    if (typeof object.searchSymbols !== "object")
                        throw TypeError(".alg.live.ClientMessage.searchSymbols: object expected");
                    message.searchSymbols = $root.alg.live.SearchSymbols.fromObject(object.searchSymbols);
                }
                if (object.placeOrder != null) {
                    if (typeof object.placeOrder !== "object")
                        throw TypeError(".alg.live.ClientMessage.placeOrder: object expected");
                    message.placeOrder = $root.alg.live.PlaceOrder.fromObject(object.placeOrder);
                }
                if (object.placeBracket != null) {
                    if (typeof object.placeBracket !== "object")
                        throw TypeError(".alg.live.ClientMessage.placeBracket: object expected");
                    message.placeBracket = $root.alg.live.PlaceBracket.fromObject(object.placeBracket);
                }
                if (object.modifyOrder != null) {
                    if (typeof object.modifyOrder !== "object")
                        throw TypeError(".alg.live.ClientMessage.modifyOrder: object expected");
                    message.modifyOrder = $root.alg.live.ModifyOrder.fromObject(object.modifyOrder);
                }
                if (object.cancelOrder != null) {
                    if (typeof object.cancelOrder !== "object")
                        throw TypeError(".alg.live.ClientMessage.cancelOrder: object expected");
                    message.cancelOrder = $root.alg.live.CancelOrder.fromObject(object.cancelOrder);
                }
                if (object.setUpdateInterval != null) {
                    if (typeof object.setUpdateInterval !== "object")
                        throw TypeError(".alg.live.ClientMessage.setUpdateInterval: object expected");
                    message.setUpdateInterval = $root.alg.live.SetUpdateInterval.fromObject(object.setUpdateInterval);
                }
                if (object.setMode != null) {
                    if (typeof object.setMode !== "object")
                        throw TypeError(".alg.live.ClientMessage.setMode: object expected");
                    message.setMode = $root.alg.live.SetMode.fromObject(object.setMode);
                }
                if (object.setDepthConfig != null) {
                    if (typeof object.setDepthConfig !== "object")
                        throw TypeError(".alg.live.ClientMessage.setDepthConfig: object expected");
                    message.setDepthConfig = $root.alg.live.SetDepthConfig.fromObject(object.setDepthConfig);
                }
                return message;
            };

            /**
             * Creates a plain object from a ClientMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.ClientMessage
             * @static
             * @param {alg.live.ClientMessage} message ClientMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ClientMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (message.subscribe != null && message.hasOwnProperty("subscribe")) {
                    object.subscribe = $root.alg.live.Subscribe.toObject(message.subscribe, options);
                    if (options.oneofs)
                        object.payload = "subscribe";
                }
                if (message.unsubscribe != null && message.hasOwnProperty("unsubscribe")) {
                    object.unsubscribe = $root.alg.live.Unsubscribe.toObject(message.unsubscribe, options);
                    if (options.oneofs)
                        object.payload = "unsubscribe";
                }
                if (message.placeOrder != null && message.hasOwnProperty("placeOrder")) {
                    object.placeOrder = $root.alg.live.PlaceOrder.toObject(message.placeOrder, options);
                    if (options.oneofs)
                        object.payload = "placeOrder";
                }
                if (message.placeBracket != null && message.hasOwnProperty("placeBracket")) {
                    object.placeBracket = $root.alg.live.PlaceBracket.toObject(message.placeBracket, options);
                    if (options.oneofs)
                        object.payload = "placeBracket";
                }
                if (message.modifyOrder != null && message.hasOwnProperty("modifyOrder")) {
                    object.modifyOrder = $root.alg.live.ModifyOrder.toObject(message.modifyOrder, options);
                    if (options.oneofs)
                        object.payload = "modifyOrder";
                }
                if (message.cancelOrder != null && message.hasOwnProperty("cancelOrder")) {
                    object.cancelOrder = $root.alg.live.CancelOrder.toObject(message.cancelOrder, options);
                    if (options.oneofs)
                        object.payload = "cancelOrder";
                }
                if (message.setUpdateInterval != null && message.hasOwnProperty("setUpdateInterval")) {
                    object.setUpdateInterval = $root.alg.live.SetUpdateInterval.toObject(message.setUpdateInterval, options);
                    if (options.oneofs)
                        object.payload = "setUpdateInterval";
                }
                if (message.setMode != null && message.hasOwnProperty("setMode")) {
                    object.setMode = $root.alg.live.SetMode.toObject(message.setMode, options);
                    if (options.oneofs)
                        object.payload = "setMode";
                }
                if (message.searchSymbols != null && message.hasOwnProperty("searchSymbols")) {
                    object.searchSymbols = $root.alg.live.SearchSymbols.toObject(message.searchSymbols, options);
                    if (options.oneofs)
                        object.payload = "searchSymbols";
                }
                if (message.setDepthConfig != null && message.hasOwnProperty("setDepthConfig")) {
                    object.setDepthConfig = $root.alg.live.SetDepthConfig.toObject(message.setDepthConfig, options);
                    if (options.oneofs)
                        object.payload = "setDepthConfig";
                }
                return object;
            };

            /**
             * Converts this ClientMessage to JSON.
             * @function toJSON
             * @memberof alg.live.ClientMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ClientMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ClientMessage
             * @function getTypeUrl
             * @memberof alg.live.ClientMessage
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ClientMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.ClientMessage";
            };

            return ClientMessage;
        })();

        live.ServerMessage = (function() {

            /**
             * Properties of a ServerMessage.
             * @memberof alg.live
             * @interface IServerMessage
             * @property {alg.live.ICandleUpdate|null} [candle] ServerMessage candle
             * @property {alg.live.IHistoricalCandles|null} [historical] ServerMessage historical
             * @property {alg.live.ISubscribed|null} [subscribed] ServerMessage subscribed
             * @property {alg.live.ISymbolSearchResult|null} [symbolSearchResult] ServerMessage symbolSearchResult
             * @property {alg.live.IAvailableSymbols|null} [availableSymbols] ServerMessage availableSymbols
             * @property {alg.live.ITradeUpdate|null} [trade] ServerMessage trade
             * @property {alg.live.IMarketStats|null} [marketStats] ServerMessage marketStats
             * @property {alg.live.IDepthSnapshot|null} [depth] ServerMessage depth
             * @property {alg.live.IHistoricalDepth|null} [historicalDepth] ServerMessage historicalDepth
             * @property {alg.live.IOrderUpdate|null} [order] ServerMessage order
             * @property {alg.live.IPositionUpdate|null} [position] ServerMessage position
             * @property {alg.live.IAccountUpdate|null} [account] ServerMessage account
             * @property {alg.live.ISnapshot|null} [snapshot] ServerMessage snapshot
             * @property {alg.live.IError|null} [error] ServerMessage error
             * @property {alg.live.IModeChanged|null} [modeChanged] ServerMessage modeChanged
             * @property {alg.live.ICapabilities|null} [capabilities] ServerMessage capabilities
             * @property {alg.live.IConnectionStatus|null} [connectionStatus] ServerMessage connectionStatus
             */

            /**
             * Constructs a new ServerMessage.
             * @memberof alg.live
             * @classdesc Represents a ServerMessage.
             * @implements IServerMessage
             * @constructor
             * @param {alg.live.IServerMessage=} [properties] Properties to set
             */
            function ServerMessage(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ServerMessage candle.
             * @member {alg.live.ICandleUpdate|null|undefined} candle
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.candle = null;

            /**
             * ServerMessage historical.
             * @member {alg.live.IHistoricalCandles|null|undefined} historical
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.historical = null;

            /**
             * ServerMessage subscribed.
             * @member {alg.live.ISubscribed|null|undefined} subscribed
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.subscribed = null;

            /**
             * ServerMessage symbolSearchResult.
             * @member {alg.live.ISymbolSearchResult|null|undefined} symbolSearchResult
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.symbolSearchResult = null;

            /**
             * ServerMessage availableSymbols.
             * @member {alg.live.IAvailableSymbols|null|undefined} availableSymbols
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.availableSymbols = null;

            /**
             * ServerMessage trade.
             * @member {alg.live.ITradeUpdate|null|undefined} trade
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.trade = null;

            /**
             * ServerMessage marketStats.
             * @member {alg.live.IMarketStats|null|undefined} marketStats
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.marketStats = null;

            /**
             * ServerMessage depth.
             * @member {alg.live.IDepthSnapshot|null|undefined} depth
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.depth = null;

            /**
             * ServerMessage historicalDepth.
             * @member {alg.live.IHistoricalDepth|null|undefined} historicalDepth
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.historicalDepth = null;

            /**
             * ServerMessage order.
             * @member {alg.live.IOrderUpdate|null|undefined} order
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.order = null;

            /**
             * ServerMessage position.
             * @member {alg.live.IPositionUpdate|null|undefined} position
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.position = null;

            /**
             * ServerMessage account.
             * @member {alg.live.IAccountUpdate|null|undefined} account
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.account = null;

            /**
             * ServerMessage snapshot.
             * @member {alg.live.ISnapshot|null|undefined} snapshot
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.snapshot = null;

            /**
             * ServerMessage error.
             * @member {alg.live.IError|null|undefined} error
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.error = null;

            /**
             * ServerMessage modeChanged.
             * @member {alg.live.IModeChanged|null|undefined} modeChanged
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.modeChanged = null;

            /**
             * ServerMessage capabilities.
             * @member {alg.live.ICapabilities|null|undefined} capabilities
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.capabilities = null;

            /**
             * ServerMessage connectionStatus.
             * @member {alg.live.IConnectionStatus|null|undefined} connectionStatus
             * @memberof alg.live.ServerMessage
             * @instance
             */
            ServerMessage.prototype.connectionStatus = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * ServerMessage payload.
             * @member {"candle"|"historical"|"subscribed"|"symbolSearchResult"|"availableSymbols"|"trade"|"marketStats"|"depth"|"historicalDepth"|"order"|"position"|"account"|"snapshot"|"error"|"modeChanged"|"capabilities"|"connectionStatus"|undefined} payload
             * @memberof alg.live.ServerMessage
             * @instance
             */
            Object.defineProperty(ServerMessage.prototype, "payload", {
                get: $util.oneOfGetter($oneOfFields = ["candle", "historical", "subscribed", "symbolSearchResult", "availableSymbols", "trade", "marketStats", "depth", "historicalDepth", "order", "position", "account", "snapshot", "error", "modeChanged", "capabilities", "connectionStatus"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ServerMessage instance using the specified properties.
             * @function create
             * @memberof alg.live.ServerMessage
             * @static
             * @param {alg.live.IServerMessage=} [properties] Properties to set
             * @returns {alg.live.ServerMessage} ServerMessage instance
             */
            ServerMessage.create = function create(properties) {
                return new ServerMessage(properties);
            };

            /**
             * Encodes the specified ServerMessage message. Does not implicitly {@link alg.live.ServerMessage.verify|verify} messages.
             * @function encode
             * @memberof alg.live.ServerMessage
             * @static
             * @param {alg.live.IServerMessage} message ServerMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ServerMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.candle != null && Object.hasOwnProperty.call(message, "candle"))
                    $root.alg.live.CandleUpdate.encode(message.candle, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.order != null && Object.hasOwnProperty.call(message, "order"))
                    $root.alg.live.OrderUpdate.encode(message.order, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.position != null && Object.hasOwnProperty.call(message, "position"))
                    $root.alg.live.PositionUpdate.encode(message.position, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.account != null && Object.hasOwnProperty.call(message, "account"))
                    $root.alg.live.AccountUpdate.encode(message.account, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                    $root.alg.live.Error.encode(message.error, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.subscribed != null && Object.hasOwnProperty.call(message, "subscribed"))
                    $root.alg.live.Subscribed.encode(message.subscribed, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.historical != null && Object.hasOwnProperty.call(message, "historical"))
                    $root.alg.live.HistoricalCandles.encode(message.historical, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.snapshot != null && Object.hasOwnProperty.call(message, "snapshot"))
                    $root.alg.live.Snapshot.encode(message.snapshot, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.modeChanged != null && Object.hasOwnProperty.call(message, "modeChanged"))
                    $root.alg.live.ModeChanged.encode(message.modeChanged, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                if (message.capabilities != null && Object.hasOwnProperty.call(message, "capabilities"))
                    $root.alg.live.Capabilities.encode(message.capabilities, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                if (message.connectionStatus != null && Object.hasOwnProperty.call(message, "connectionStatus"))
                    $root.alg.live.ConnectionStatus.encode(message.connectionStatus, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
                if (message.symbolSearchResult != null && Object.hasOwnProperty.call(message, "symbolSearchResult"))
                    $root.alg.live.SymbolSearchResult.encode(message.symbolSearchResult, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
                if (message.availableSymbols != null && Object.hasOwnProperty.call(message, "availableSymbols"))
                    $root.alg.live.AvailableSymbols.encode(message.availableSymbols, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
                if (message.trade != null && Object.hasOwnProperty.call(message, "trade"))
                    $root.alg.live.TradeUpdate.encode(message.trade, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
                if (message.marketStats != null && Object.hasOwnProperty.call(message, "marketStats"))
                    $root.alg.live.MarketStats.encode(message.marketStats, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
                if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
                    $root.alg.live.DepthSnapshot.encode(message.depth, writer.uint32(/* id 16, wireType 2 =*/130).fork()).ldelim();
                if (message.historicalDepth != null && Object.hasOwnProperty.call(message, "historicalDepth"))
                    $root.alg.live.HistoricalDepth.encode(message.historicalDepth, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ServerMessage message, length delimited. Does not implicitly {@link alg.live.ServerMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof alg.live.ServerMessage
             * @static
             * @param {alg.live.IServerMessage} message ServerMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ServerMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ServerMessage message from the specified reader or buffer.
             * @function decode
             * @memberof alg.live.ServerMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {alg.live.ServerMessage} ServerMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ServerMessage.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.alg.live.ServerMessage();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.candle = $root.alg.live.CandleUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    case 7: {
                            message.historical = $root.alg.live.HistoricalCandles.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.subscribed = $root.alg.live.Subscribed.decode(reader, reader.uint32());
                            break;
                        }
                    case 12: {
                            message.symbolSearchResult = $root.alg.live.SymbolSearchResult.decode(reader, reader.uint32());
                            break;
                        }
                    case 13: {
                            message.availableSymbols = $root.alg.live.AvailableSymbols.decode(reader, reader.uint32());
                            break;
                        }
                    case 14: {
                            message.trade = $root.alg.live.TradeUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    case 15: {
                            message.marketStats = $root.alg.live.MarketStats.decode(reader, reader.uint32());
                            break;
                        }
                    case 16: {
                            message.depth = $root.alg.live.DepthSnapshot.decode(reader, reader.uint32());
                            break;
                        }
                    case 17: {
                            message.historicalDepth = $root.alg.live.HistoricalDepth.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.order = $root.alg.live.OrderUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.position = $root.alg.live.PositionUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.account = $root.alg.live.AccountUpdate.decode(reader, reader.uint32());
                            break;
                        }
                    case 8: {
                            message.snapshot = $root.alg.live.Snapshot.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.error = $root.alg.live.Error.decode(reader, reader.uint32());
                            break;
                        }
                    case 9: {
                            message.modeChanged = $root.alg.live.ModeChanged.decode(reader, reader.uint32());
                            break;
                        }
                    case 10: {
                            message.capabilities = $root.alg.live.Capabilities.decode(reader, reader.uint32());
                            break;
                        }
                    case 11: {
                            message.connectionStatus = $root.alg.live.ConnectionStatus.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ServerMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof alg.live.ServerMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {alg.live.ServerMessage} ServerMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ServerMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ServerMessage message.
             * @function verify
             * @memberof alg.live.ServerMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ServerMessage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.candle != null && message.hasOwnProperty("candle")) {
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.CandleUpdate.verify(message.candle);
                        if (error)
                            return "candle." + error;
                    }
                }
                if (message.historical != null && message.hasOwnProperty("historical")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.HistoricalCandles.verify(message.historical);
                        if (error)
                            return "historical." + error;
                    }
                }
                if (message.subscribed != null && message.hasOwnProperty("subscribed")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.Subscribed.verify(message.subscribed);
                        if (error)
                            return "subscribed." + error;
                    }
                }
                if (message.symbolSearchResult != null && message.hasOwnProperty("symbolSearchResult")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.SymbolSearchResult.verify(message.symbolSearchResult);
                        if (error)
                            return "symbolSearchResult." + error;
                    }
                }
                if (message.availableSymbols != null && message.hasOwnProperty("availableSymbols")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.AvailableSymbols.verify(message.availableSymbols);
                        if (error)
                            return "availableSymbols." + error;
                    }
                }
                if (message.trade != null && message.hasOwnProperty("trade")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.TradeUpdate.verify(message.trade);
                        if (error)
                            return "trade." + error;
                    }
                }
                if (message.marketStats != null && message.hasOwnProperty("marketStats")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.MarketStats.verify(message.marketStats);
                        if (error)
                            return "marketStats." + error;
                    }
                }
                if (message.depth != null && message.hasOwnProperty("depth")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.DepthSnapshot.verify(message.depth);
                        if (error)
                            return "depth." + error;
                    }
                }
                if (message.historicalDepth != null && message.hasOwnProperty("historicalDepth")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.HistoricalDepth.verify(message.historicalDepth);
                        if (error)
                            return "historicalDepth." + error;
                    }
                }
                if (message.order != null && message.hasOwnProperty("order")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.OrderUpdate.verify(message.order);
                        if (error)
                            return "order." + error;
                    }
                }
                if (message.position != null && message.hasOwnProperty("position")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.PositionUpdate.verify(message.position);
                        if (error)
                            return "position." + error;
                    }
                }
                if (message.account != null && message.hasOwnProperty("account")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.AccountUpdate.verify(message.account);
                        if (error)
                            return "account." + error;
                    }
                }
                if (message.snapshot != null && message.hasOwnProperty("snapshot")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.Snapshot.verify(message.snapshot);
                        if (error)
                            return "snapshot." + error;
                    }
                }
                if (message.error != null && message.hasOwnProperty("error")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.Error.verify(message.error);
                        if (error)
                            return "error." + error;
                    }
                }
                if (message.modeChanged != null && message.hasOwnProperty("modeChanged")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.ModeChanged.verify(message.modeChanged);
                        if (error)
                            return "modeChanged." + error;
                    }
                }
                if (message.capabilities != null && message.hasOwnProperty("capabilities")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.Capabilities.verify(message.capabilities);
                        if (error)
                            return "capabilities." + error;
                    }
                }
                if (message.connectionStatus != null && message.hasOwnProperty("connectionStatus")) {
                    if (properties.payload === 1)
                        return "payload: multiple values";
                    properties.payload = 1;
                    {
                        let error = $root.alg.live.ConnectionStatus.verify(message.connectionStatus);
                        if (error)
                            return "connectionStatus." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ServerMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof alg.live.ServerMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {alg.live.ServerMessage} ServerMessage
             */
            ServerMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.alg.live.ServerMessage)
                    return object;
                let message = new $root.alg.live.ServerMessage();
                if (object.candle != null) {
                    if (typeof object.candle !== "object")
                        throw TypeError(".alg.live.ServerMessage.candle: object expected");
                    message.candle = $root.alg.live.CandleUpdate.fromObject(object.candle);
                }
                if (object.historical != null) {
                    if (typeof object.historical !== "object")
                        throw TypeError(".alg.live.ServerMessage.historical: object expected");
                    message.historical = $root.alg.live.HistoricalCandles.fromObject(object.historical);
                }
                if (object.subscribed != null) {
                    if (typeof object.subscribed !== "object")
                        throw TypeError(".alg.live.ServerMessage.subscribed: object expected");
                    message.subscribed = $root.alg.live.Subscribed.fromObject(object.subscribed);
                }
                if (object.symbolSearchResult != null) {
                    if (typeof object.symbolSearchResult !== "object")
                        throw TypeError(".alg.live.ServerMessage.symbolSearchResult: object expected");
                    message.symbolSearchResult = $root.alg.live.SymbolSearchResult.fromObject(object.symbolSearchResult);
                }
                if (object.availableSymbols != null) {
                    if (typeof object.availableSymbols !== "object")
                        throw TypeError(".alg.live.ServerMessage.availableSymbols: object expected");
                    message.availableSymbols = $root.alg.live.AvailableSymbols.fromObject(object.availableSymbols);
                }
                if (object.trade != null) {
                    if (typeof object.trade !== "object")
                        throw TypeError(".alg.live.ServerMessage.trade: object expected");
                    message.trade = $root.alg.live.TradeUpdate.fromObject(object.trade);
                }
                if (object.marketStats != null) {
                    if (typeof object.marketStats !== "object")
                        throw TypeError(".alg.live.ServerMessage.marketStats: object expected");
                    message.marketStats = $root.alg.live.MarketStats.fromObject(object.marketStats);
                }
                if (object.depth != null) {
                    if (typeof object.depth !== "object")
                        throw TypeError(".alg.live.ServerMessage.depth: object expected");
                    message.depth = $root.alg.live.DepthSnapshot.fromObject(object.depth);
                }
                if (object.historicalDepth != null) {
                    if (typeof object.historicalDepth !== "object")
                        throw TypeError(".alg.live.ServerMessage.historicalDepth: object expected");
                    message.historicalDepth = $root.alg.live.HistoricalDepth.fromObject(object.historicalDepth);
                }
                if (object.order != null) {
                    if (typeof object.order !== "object")
                        throw TypeError(".alg.live.ServerMessage.order: object expected");
                    message.order = $root.alg.live.OrderUpdate.fromObject(object.order);
                }
                if (object.position != null) {
                    if (typeof object.position !== "object")
                        throw TypeError(".alg.live.ServerMessage.position: object expected");
                    message.position = $root.alg.live.PositionUpdate.fromObject(object.position);
                }
                if (object.account != null) {
                    if (typeof object.account !== "object")
                        throw TypeError(".alg.live.ServerMessage.account: object expected");
                    message.account = $root.alg.live.AccountUpdate.fromObject(object.account);
                }
                if (object.snapshot != null) {
                    if (typeof object.snapshot !== "object")
                        throw TypeError(".alg.live.ServerMessage.snapshot: object expected");
                    message.snapshot = $root.alg.live.Snapshot.fromObject(object.snapshot);
                }
                if (object.error != null) {
                    if (typeof object.error !== "object")
                        throw TypeError(".alg.live.ServerMessage.error: object expected");
                    message.error = $root.alg.live.Error.fromObject(object.error);
                }
                if (object.modeChanged != null) {
                    if (typeof object.modeChanged !== "object")
                        throw TypeError(".alg.live.ServerMessage.modeChanged: object expected");
                    message.modeChanged = $root.alg.live.ModeChanged.fromObject(object.modeChanged);
                }
                if (object.capabilities != null) {
                    if (typeof object.capabilities !== "object")
                        throw TypeError(".alg.live.ServerMessage.capabilities: object expected");
                    message.capabilities = $root.alg.live.Capabilities.fromObject(object.capabilities);
                }
                if (object.connectionStatus != null) {
                    if (typeof object.connectionStatus !== "object")
                        throw TypeError(".alg.live.ServerMessage.connectionStatus: object expected");
                    message.connectionStatus = $root.alg.live.ConnectionStatus.fromObject(object.connectionStatus);
                }
                return message;
            };

            /**
             * Creates a plain object from a ServerMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof alg.live.ServerMessage
             * @static
             * @param {alg.live.ServerMessage} message ServerMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ServerMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (message.candle != null && message.hasOwnProperty("candle")) {
                    object.candle = $root.alg.live.CandleUpdate.toObject(message.candle, options);
                    if (options.oneofs)
                        object.payload = "candle";
                }
                if (message.order != null && message.hasOwnProperty("order")) {
                    object.order = $root.alg.live.OrderUpdate.toObject(message.order, options);
                    if (options.oneofs)
                        object.payload = "order";
                }
                if (message.position != null && message.hasOwnProperty("position")) {
                    object.position = $root.alg.live.PositionUpdate.toObject(message.position, options);
                    if (options.oneofs)
                        object.payload = "position";
                }
                if (message.account != null && message.hasOwnProperty("account")) {
                    object.account = $root.alg.live.AccountUpdate.toObject(message.account, options);
                    if (options.oneofs)
                        object.payload = "account";
                }
                if (message.error != null && message.hasOwnProperty("error")) {
                    object.error = $root.alg.live.Error.toObject(message.error, options);
                    if (options.oneofs)
                        object.payload = "error";
                }
                if (message.subscribed != null && message.hasOwnProperty("subscribed")) {
                    object.subscribed = $root.alg.live.Subscribed.toObject(message.subscribed, options);
                    if (options.oneofs)
                        object.payload = "subscribed";
                }
                if (message.historical != null && message.hasOwnProperty("historical")) {
                    object.historical = $root.alg.live.HistoricalCandles.toObject(message.historical, options);
                    if (options.oneofs)
                        object.payload = "historical";
                }
                if (message.snapshot != null && message.hasOwnProperty("snapshot")) {
                    object.snapshot = $root.alg.live.Snapshot.toObject(message.snapshot, options);
                    if (options.oneofs)
                        object.payload = "snapshot";
                }
                if (message.modeChanged != null && message.hasOwnProperty("modeChanged")) {
                    object.modeChanged = $root.alg.live.ModeChanged.toObject(message.modeChanged, options);
                    if (options.oneofs)
                        object.payload = "modeChanged";
                }
                if (message.capabilities != null && message.hasOwnProperty("capabilities")) {
                    object.capabilities = $root.alg.live.Capabilities.toObject(message.capabilities, options);
                    if (options.oneofs)
                        object.payload = "capabilities";
                }
                if (message.connectionStatus != null && message.hasOwnProperty("connectionStatus")) {
                    object.connectionStatus = $root.alg.live.ConnectionStatus.toObject(message.connectionStatus, options);
                    if (options.oneofs)
                        object.payload = "connectionStatus";
                }
                if (message.symbolSearchResult != null && message.hasOwnProperty("symbolSearchResult")) {
                    object.symbolSearchResult = $root.alg.live.SymbolSearchResult.toObject(message.symbolSearchResult, options);
                    if (options.oneofs)
                        object.payload = "symbolSearchResult";
                }
                if (message.availableSymbols != null && message.hasOwnProperty("availableSymbols")) {
                    object.availableSymbols = $root.alg.live.AvailableSymbols.toObject(message.availableSymbols, options);
                    if (options.oneofs)
                        object.payload = "availableSymbols";
                }
                if (message.trade != null && message.hasOwnProperty("trade")) {
                    object.trade = $root.alg.live.TradeUpdate.toObject(message.trade, options);
                    if (options.oneofs)
                        object.payload = "trade";
                }
                if (message.marketStats != null && message.hasOwnProperty("marketStats")) {
                    object.marketStats = $root.alg.live.MarketStats.toObject(message.marketStats, options);
                    if (options.oneofs)
                        object.payload = "marketStats";
                }
                if (message.depth != null && message.hasOwnProperty("depth")) {
                    object.depth = $root.alg.live.DepthSnapshot.toObject(message.depth, options);
                    if (options.oneofs)
                        object.payload = "depth";
                }
                if (message.historicalDepth != null && message.hasOwnProperty("historicalDepth")) {
                    object.historicalDepth = $root.alg.live.HistoricalDepth.toObject(message.historicalDepth, options);
                    if (options.oneofs)
                        object.payload = "historicalDepth";
                }
                return object;
            };

            /**
             * Converts this ServerMessage to JSON.
             * @function toJSON
             * @memberof alg.live.ServerMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ServerMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ServerMessage
             * @function getTypeUrl
             * @memberof alg.live.ServerMessage
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ServerMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/alg.live.ServerMessage";
            };

            return ServerMessage;
        })();

        return live;
    })();

    return alg;
})();

export { $root as default };
