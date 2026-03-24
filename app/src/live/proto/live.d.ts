import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace alg. */
export namespace alg {

    /** Namespace live. */
    namespace live {

        /** Properties of an AccountUpdate. */
        interface IAccountUpdate {

            /** AccountUpdate balance */
            balance?: (number|Long|null);

            /** AccountUpdate marginUsed */
            marginUsed?: (number|Long|null);

            /** AccountUpdate marginAvailable */
            marginAvailable?: (number|Long|null);

            /** AccountUpdate openPnl */
            openPnl?: (number|Long|null);

            /** AccountUpdate realizedPnl */
            realizedPnl?: (number|Long|null);

            /** AccountUpdate commission */
            commission?: (number|Long|null);

            /** AccountUpdate accountId */
            accountId?: (string|null);

            /** AccountUpdate fcmId */
            fcmId?: (string|null);
        }

        /** Represents an AccountUpdate. */
        class AccountUpdate implements IAccountUpdate {

            /**
             * Constructs a new AccountUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IAccountUpdate);

            /** AccountUpdate balance. */
            public balance: (number|Long);

            /** AccountUpdate marginUsed. */
            public marginUsed: (number|Long);

            /** AccountUpdate marginAvailable. */
            public marginAvailable: (number|Long);

            /** AccountUpdate openPnl. */
            public openPnl: (number|Long);

            /** AccountUpdate realizedPnl. */
            public realizedPnl: (number|Long);

            /** AccountUpdate commission. */
            public commission: (number|Long);

            /** AccountUpdate accountId. */
            public accountId: string;

            /** AccountUpdate fcmId. */
            public fcmId: string;

            /**
             * Creates a new AccountUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AccountUpdate instance
             */
            public static create(properties?: alg.live.IAccountUpdate): alg.live.AccountUpdate;

            /**
             * Encodes the specified AccountUpdate message. Does not implicitly {@link alg.live.AccountUpdate.verify|verify} messages.
             * @param message AccountUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IAccountUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AccountUpdate message, length delimited. Does not implicitly {@link alg.live.AccountUpdate.verify|verify} messages.
             * @param message AccountUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IAccountUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AccountUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns AccountUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.AccountUpdate;

            /**
             * Decodes an AccountUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns AccountUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.AccountUpdate;

            /**
             * Verifies an AccountUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AccountUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AccountUpdate
             */
            public static fromObject(object: { [k: string]: any }): alg.live.AccountUpdate;

            /**
             * Creates a plain object from an AccountUpdate message. Also converts values to other types if specified.
             * @param message AccountUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.AccountUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AccountUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for AccountUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PositionUpdate. */
        interface IPositionUpdate {

            /** PositionUpdate symbol */
            symbol?: (string|null);

            /** PositionUpdate side */
            side?: (alg.live.Side|null);

            /** PositionUpdate qty */
            qty?: (number|null);

            /** PositionUpdate avgEntry */
            avgEntry?: (number|Long|null);

            /** PositionUpdate unrealizedPnl */
            unrealizedPnl?: (number|Long|null);
        }

        /** Represents a PositionUpdate. */
        class PositionUpdate implements IPositionUpdate {

            /**
             * Constructs a new PositionUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IPositionUpdate);

            /** PositionUpdate symbol. */
            public symbol: string;

            /** PositionUpdate side. */
            public side: alg.live.Side;

            /** PositionUpdate qty. */
            public qty: number;

            /** PositionUpdate avgEntry. */
            public avgEntry: (number|Long);

            /** PositionUpdate unrealizedPnl. */
            public unrealizedPnl: (number|Long);

            /**
             * Creates a new PositionUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PositionUpdate instance
             */
            public static create(properties?: alg.live.IPositionUpdate): alg.live.PositionUpdate;

            /**
             * Encodes the specified PositionUpdate message. Does not implicitly {@link alg.live.PositionUpdate.verify|verify} messages.
             * @param message PositionUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IPositionUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PositionUpdate message, length delimited. Does not implicitly {@link alg.live.PositionUpdate.verify|verify} messages.
             * @param message PositionUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IPositionUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PositionUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.PositionUpdate;

            /**
             * Decodes a PositionUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PositionUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.PositionUpdate;

            /**
             * Verifies a PositionUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PositionUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PositionUpdate
             */
            public static fromObject(object: { [k: string]: any }): alg.live.PositionUpdate;

            /**
             * Creates a plain object from a PositionUpdate message. Also converts values to other types if specified.
             * @param message PositionUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.PositionUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PositionUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PositionUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Snapshot. */
        interface ISnapshot {

            /** Snapshot currentCandles */
            currentCandles?: (alg.live.ICandleUpdate[]|null);

            /** Snapshot openOrders */
            openOrders?: (alg.live.IOrderUpdate[]|null);

            /** Snapshot positions */
            positions?: (alg.live.IPositionUpdate[]|null);

            /** Snapshot account */
            account?: (alg.live.IAccountUpdate|null);
        }

        /** Represents a Snapshot. */
        class Snapshot implements ISnapshot {

            /**
             * Constructs a new Snapshot.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISnapshot);

            /** Snapshot currentCandles. */
            public currentCandles: alg.live.ICandleUpdate[];

            /** Snapshot openOrders. */
            public openOrders: alg.live.IOrderUpdate[];

            /** Snapshot positions. */
            public positions: alg.live.IPositionUpdate[];

            /** Snapshot account. */
            public account?: (alg.live.IAccountUpdate|null);

            /**
             * Creates a new Snapshot instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Snapshot instance
             */
            public static create(properties?: alg.live.ISnapshot): alg.live.Snapshot;

            /**
             * Encodes the specified Snapshot message. Does not implicitly {@link alg.live.Snapshot.verify|verify} messages.
             * @param message Snapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Snapshot message, length delimited. Does not implicitly {@link alg.live.Snapshot.verify|verify} messages.
             * @param message Snapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Snapshot message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Snapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.Snapshot;

            /**
             * Decodes a Snapshot message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Snapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.Snapshot;

            /**
             * Verifies a Snapshot message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Snapshot message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Snapshot
             */
            public static fromObject(object: { [k: string]: any }): alg.live.Snapshot;

            /**
             * Creates a plain object from a Snapshot message. Also converts values to other types if specified.
             * @param message Snapshot
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.Snapshot, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Snapshot to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Snapshot
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Side enum. */
        enum Side {
            SIDE_UNKNOWN = 0,
            BUY = 1,
            SELL = 2
        }

        /** OrderType enum. */
        enum OrderType {
            ORDER_TYPE_UNKNOWN = 0,
            MARKET = 1,
            LIMIT = 2,
            STOP = 3,
            STOP_LIMIT = 4
        }

        /** OrderStatus enum. */
        enum OrderStatus {
            ORDER_STATUS_UNKNOWN = 0,
            PENDING = 1,
            ACCEPTED = 2,
            WORKING = 3,
            PARTIAL_FILL = 4,
            FILLED = 5,
            CANCELLED = 6,
            REJECTED = 7
        }

        /** Timeframe enum. */
        enum Timeframe {
            TIMEFRAME_UNKNOWN = 0,
            S1 = 1,
            S5 = 2,
            M1 = 3,
            M5 = 4,
            M15 = 5,
            H1 = 6,
            H4 = 7,
            D1 = 8
        }

        /** DataMode enum. */
        enum DataMode {
            DATA_MODE_UNKNOWN = 0,
            DATA_MOCK = 1,
            DATA_LIVE = 2
        }

        /** TradeMode enum. */
        enum TradeMode {
            TRADE_MODE_UNKNOWN = 0,
            TRADE_PAPER = 1,
            TRADE_LIVE = 2
        }

        /** DataProvider enum. */
        enum DataProvider {
            DATA_PROVIDER_NONE = 0,
            DATA_PROVIDER_RITHMIC = 1,
            DATA_PROVIDER_DATABENTO = 2
        }

        /** HistoricalSource enum. */
        enum HistoricalSource {
            HISTORICAL_AUTO = 0,
            HISTORICAL_RITHMIC = 1,
            HISTORICAL_DATABENTO = 2,
            HISTORICAL_NONE = 3
        }

        /** BracketType enum. */
        enum BracketType {
            BRACKET_TYPE_UNKNOWN = 0,
            BRACKET_ENTRY = 1,
            BRACKET_TAKE_PROFIT = 2,
            BRACKET_STOP_LOSS = 3
        }

        /** Properties of a PlaceOrder. */
        interface IPlaceOrder {

            /** PlaceOrder requestId */
            requestId?: (string|null);

            /** PlaceOrder clientOrderId */
            clientOrderId?: (string|null);

            /** PlaceOrder symbol */
            symbol?: (string|null);

            /** PlaceOrder side */
            side?: (alg.live.Side|null);

            /** PlaceOrder qty */
            qty?: (number|null);

            /** PlaceOrder orderType */
            orderType?: (alg.live.OrderType|null);

            /** PlaceOrder limitPrice */
            limitPrice?: (number|Long|null);

            /** PlaceOrder stopPrice */
            stopPrice?: (number|Long|null);

            /** PlaceOrder source */
            source?: (string|null);
        }

        /** Represents a PlaceOrder. */
        class PlaceOrder implements IPlaceOrder {

            /**
             * Constructs a new PlaceOrder.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IPlaceOrder);

            /** PlaceOrder requestId. */
            public requestId: string;

            /** PlaceOrder clientOrderId. */
            public clientOrderId: string;

            /** PlaceOrder symbol. */
            public symbol: string;

            /** PlaceOrder side. */
            public side: alg.live.Side;

            /** PlaceOrder qty. */
            public qty: number;

            /** PlaceOrder orderType. */
            public orderType: alg.live.OrderType;

            /** PlaceOrder limitPrice. */
            public limitPrice?: (number|Long|null);

            /** PlaceOrder stopPrice. */
            public stopPrice?: (number|Long|null);

            /** PlaceOrder source. */
            public source: string;

            /**
             * Creates a new PlaceOrder instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PlaceOrder instance
             */
            public static create(properties?: alg.live.IPlaceOrder): alg.live.PlaceOrder;

            /**
             * Encodes the specified PlaceOrder message. Does not implicitly {@link alg.live.PlaceOrder.verify|verify} messages.
             * @param message PlaceOrder message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IPlaceOrder, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PlaceOrder message, length delimited. Does not implicitly {@link alg.live.PlaceOrder.verify|verify} messages.
             * @param message PlaceOrder message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IPlaceOrder, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PlaceOrder message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PlaceOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.PlaceOrder;

            /**
             * Decodes a PlaceOrder message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PlaceOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.PlaceOrder;

            /**
             * Verifies a PlaceOrder message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PlaceOrder message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PlaceOrder
             */
            public static fromObject(object: { [k: string]: any }): alg.live.PlaceOrder;

            /**
             * Creates a plain object from a PlaceOrder message. Also converts values to other types if specified.
             * @param message PlaceOrder
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.PlaceOrder, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PlaceOrder to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PlaceOrder
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PlaceBracket. */
        interface IPlaceBracket {

            /** PlaceBracket requestId */
            requestId?: (string|null);

            /** PlaceBracket clientOrderId */
            clientOrderId?: (string|null);

            /** PlaceBracket correlationId */
            correlationId?: (string|null);

            /** PlaceBracket symbol */
            symbol?: (string|null);

            /** PlaceBracket side */
            side?: (alg.live.Side|null);

            /** PlaceBracket qty */
            qty?: (number|null);

            /** PlaceBracket entryPrice */
            entryPrice?: (number|Long|null);

            /** PlaceBracket stopLoss */
            stopLoss?: (number|Long|null);

            /** PlaceBracket takeProfit */
            takeProfit?: (number|Long|null);
        }

        /** Represents a PlaceBracket. */
        class PlaceBracket implements IPlaceBracket {

            /**
             * Constructs a new PlaceBracket.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IPlaceBracket);

            /** PlaceBracket requestId. */
            public requestId: string;

            /** PlaceBracket clientOrderId. */
            public clientOrderId: string;

            /** PlaceBracket correlationId. */
            public correlationId: string;

            /** PlaceBracket symbol. */
            public symbol: string;

            /** PlaceBracket side. */
            public side: alg.live.Side;

            /** PlaceBracket qty. */
            public qty: number;

            /** PlaceBracket entryPrice. */
            public entryPrice: (number|Long);

            /** PlaceBracket stopLoss. */
            public stopLoss: (number|Long);

            /** PlaceBracket takeProfit. */
            public takeProfit: (number|Long);

            /**
             * Creates a new PlaceBracket instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PlaceBracket instance
             */
            public static create(properties?: alg.live.IPlaceBracket): alg.live.PlaceBracket;

            /**
             * Encodes the specified PlaceBracket message. Does not implicitly {@link alg.live.PlaceBracket.verify|verify} messages.
             * @param message PlaceBracket message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IPlaceBracket, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PlaceBracket message, length delimited. Does not implicitly {@link alg.live.PlaceBracket.verify|verify} messages.
             * @param message PlaceBracket message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IPlaceBracket, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PlaceBracket message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PlaceBracket
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.PlaceBracket;

            /**
             * Decodes a PlaceBracket message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PlaceBracket
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.PlaceBracket;

            /**
             * Verifies a PlaceBracket message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PlaceBracket message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PlaceBracket
             */
            public static fromObject(object: { [k: string]: any }): alg.live.PlaceBracket;

            /**
             * Creates a plain object from a PlaceBracket message. Also converts values to other types if specified.
             * @param message PlaceBracket
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.PlaceBracket, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PlaceBracket to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PlaceBracket
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ModifyOrder. */
        interface IModifyOrder {

            /** ModifyOrder requestId */
            requestId?: (string|null);

            /** ModifyOrder clientOrderId */
            clientOrderId?: (string|null);

            /** ModifyOrder newPrice */
            newPrice?: (number|Long|null);
        }

        /** Represents a ModifyOrder. */
        class ModifyOrder implements IModifyOrder {

            /**
             * Constructs a new ModifyOrder.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IModifyOrder);

            /** ModifyOrder requestId. */
            public requestId: string;

            /** ModifyOrder clientOrderId. */
            public clientOrderId: string;

            /** ModifyOrder newPrice. */
            public newPrice: (number|Long);

            /**
             * Creates a new ModifyOrder instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ModifyOrder instance
             */
            public static create(properties?: alg.live.IModifyOrder): alg.live.ModifyOrder;

            /**
             * Encodes the specified ModifyOrder message. Does not implicitly {@link alg.live.ModifyOrder.verify|verify} messages.
             * @param message ModifyOrder message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IModifyOrder, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ModifyOrder message, length delimited. Does not implicitly {@link alg.live.ModifyOrder.verify|verify} messages.
             * @param message ModifyOrder message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IModifyOrder, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ModifyOrder message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ModifyOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.ModifyOrder;

            /**
             * Decodes a ModifyOrder message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ModifyOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.ModifyOrder;

            /**
             * Verifies a ModifyOrder message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ModifyOrder message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ModifyOrder
             */
            public static fromObject(object: { [k: string]: any }): alg.live.ModifyOrder;

            /**
             * Creates a plain object from a ModifyOrder message. Also converts values to other types if specified.
             * @param message ModifyOrder
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.ModifyOrder, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ModifyOrder to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ModifyOrder
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CancelOrder. */
        interface ICancelOrder {

            /** CancelOrder requestId */
            requestId?: (string|null);

            /** CancelOrder clientOrderId */
            clientOrderId?: (string|null);
        }

        /** Represents a CancelOrder. */
        class CancelOrder implements ICancelOrder {

            /**
             * Constructs a new CancelOrder.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ICancelOrder);

            /** CancelOrder requestId. */
            public requestId: string;

            /** CancelOrder clientOrderId. */
            public clientOrderId: string;

            /**
             * Creates a new CancelOrder instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CancelOrder instance
             */
            public static create(properties?: alg.live.ICancelOrder): alg.live.CancelOrder;

            /**
             * Encodes the specified CancelOrder message. Does not implicitly {@link alg.live.CancelOrder.verify|verify} messages.
             * @param message CancelOrder message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ICancelOrder, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CancelOrder message, length delimited. Does not implicitly {@link alg.live.CancelOrder.verify|verify} messages.
             * @param message CancelOrder message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ICancelOrder, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CancelOrder message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CancelOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.CancelOrder;

            /**
             * Decodes a CancelOrder message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CancelOrder
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.CancelOrder;

            /**
             * Verifies a CancelOrder message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CancelOrder message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CancelOrder
             */
            public static fromObject(object: { [k: string]: any }): alg.live.CancelOrder;

            /**
             * Creates a plain object from a CancelOrder message. Also converts values to other types if specified.
             * @param message CancelOrder
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.CancelOrder, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CancelOrder to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for CancelOrder
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an OrderUpdate. */
        interface IOrderUpdate {

            /** OrderUpdate requestId */
            requestId?: (string|null);

            /** OrderUpdate clientOrderId */
            clientOrderId?: (string|null);

            /** OrderUpdate exchangeOrderId */
            exchangeOrderId?: (string|null);

            /** OrderUpdate status */
            status?: (alg.live.OrderStatus|null);

            /** OrderUpdate filledQty */
            filledQty?: (number|null);

            /** OrderUpdate avgFillPrice */
            avgFillPrice?: (number|Long|null);

            /** OrderUpdate rejectReason */
            rejectReason?: (string|null);

            /** OrderUpdate timestamp */
            timestamp?: (number|Long|null);

            /** OrderUpdate symbol */
            symbol?: (string|null);

            /** OrderUpdate side */
            side?: (alg.live.Side|null);

            /** OrderUpdate qty */
            qty?: (number|null);

            /** OrderUpdate orderType */
            orderType?: (alg.live.OrderType|null);

            /** OrderUpdate limitPrice */
            limitPrice?: (number|Long|null);

            /** OrderUpdate stopPrice */
            stopPrice?: (number|Long|null);

            /** OrderUpdate bracketId */
            bracketId?: (string|null);

            /** OrderUpdate bracketType */
            bracketType?: (alg.live.BracketType|null);
        }

        /** Represents an OrderUpdate. */
        class OrderUpdate implements IOrderUpdate {

            /**
             * Constructs a new OrderUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IOrderUpdate);

            /** OrderUpdate requestId. */
            public requestId: string;

            /** OrderUpdate clientOrderId. */
            public clientOrderId: string;

            /** OrderUpdate exchangeOrderId. */
            public exchangeOrderId: string;

            /** OrderUpdate status. */
            public status: alg.live.OrderStatus;

            /** OrderUpdate filledQty. */
            public filledQty: number;

            /** OrderUpdate avgFillPrice. */
            public avgFillPrice?: (number|Long|null);

            /** OrderUpdate rejectReason. */
            public rejectReason?: (string|null);

            /** OrderUpdate timestamp. */
            public timestamp: (number|Long);

            /** OrderUpdate symbol. */
            public symbol: string;

            /** OrderUpdate side. */
            public side: alg.live.Side;

            /** OrderUpdate qty. */
            public qty: number;

            /** OrderUpdate orderType. */
            public orderType: alg.live.OrderType;

            /** OrderUpdate limitPrice. */
            public limitPrice?: (number|Long|null);

            /** OrderUpdate stopPrice. */
            public stopPrice?: (number|Long|null);

            /** OrderUpdate bracketId. */
            public bracketId?: (string|null);

            /** OrderUpdate bracketType. */
            public bracketType?: (alg.live.BracketType|null);

            /**
             * Creates a new OrderUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OrderUpdate instance
             */
            public static create(properties?: alg.live.IOrderUpdate): alg.live.OrderUpdate;

            /**
             * Encodes the specified OrderUpdate message. Does not implicitly {@link alg.live.OrderUpdate.verify|verify} messages.
             * @param message OrderUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IOrderUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OrderUpdate message, length delimited. Does not implicitly {@link alg.live.OrderUpdate.verify|verify} messages.
             * @param message OrderUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IOrderUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OrderUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OrderUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.OrderUpdate;

            /**
             * Decodes an OrderUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OrderUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.OrderUpdate;

            /**
             * Verifies an OrderUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OrderUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OrderUpdate
             */
            public static fromObject(object: { [k: string]: any }): alg.live.OrderUpdate;

            /**
             * Creates a plain object from an OrderUpdate message. Also converts values to other types if specified.
             * @param message OrderUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.OrderUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OrderUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for OrderUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CandleUpdate. */
        interface ICandleUpdate {

            /** CandleUpdate symbol */
            symbol?: (string|null);

            /** CandleUpdate timeframe */
            timeframe?: (alg.live.Timeframe|null);

            /** CandleUpdate ts */
            ts?: (number|Long|null);

            /** CandleUpdate open */
            open?: (number|Long|null);

            /** CandleUpdate high */
            high?: (number|Long|null);

            /** CandleUpdate low */
            low?: (number|Long|null);

            /** CandleUpdate close */
            close?: (number|Long|null);

            /** CandleUpdate volume */
            volume?: (number|Long|null);

            /** CandleUpdate isClosed */
            isClosed?: (boolean|null);

            /** CandleUpdate exchangeTs */
            exchangeTs?: (number|Long|null);

            /** CandleUpdate serverTs */
            serverTs?: (number|Long|null);
        }

        /** Represents a CandleUpdate. */
        class CandleUpdate implements ICandleUpdate {

            /**
             * Constructs a new CandleUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ICandleUpdate);

            /** CandleUpdate symbol. */
            public symbol: string;

            /** CandleUpdate timeframe. */
            public timeframe: alg.live.Timeframe;

            /** CandleUpdate ts. */
            public ts: (number|Long);

            /** CandleUpdate open. */
            public open: (number|Long);

            /** CandleUpdate high. */
            public high: (number|Long);

            /** CandleUpdate low. */
            public low: (number|Long);

            /** CandleUpdate close. */
            public close: (number|Long);

            /** CandleUpdate volume. */
            public volume: (number|Long);

            /** CandleUpdate isClosed. */
            public isClosed: boolean;

            /** CandleUpdate exchangeTs. */
            public exchangeTs?: (number|Long|null);

            /** CandleUpdate serverTs. */
            public serverTs?: (number|Long|null);

            /**
             * Creates a new CandleUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CandleUpdate instance
             */
            public static create(properties?: alg.live.ICandleUpdate): alg.live.CandleUpdate;

            /**
             * Encodes the specified CandleUpdate message. Does not implicitly {@link alg.live.CandleUpdate.verify|verify} messages.
             * @param message CandleUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ICandleUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CandleUpdate message, length delimited. Does not implicitly {@link alg.live.CandleUpdate.verify|verify} messages.
             * @param message CandleUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ICandleUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CandleUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CandleUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.CandleUpdate;

            /**
             * Decodes a CandleUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CandleUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.CandleUpdate;

            /**
             * Verifies a CandleUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CandleUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CandleUpdate
             */
            public static fromObject(object: { [k: string]: any }): alg.live.CandleUpdate;

            /**
             * Creates a plain object from a CandleUpdate message. Also converts values to other types if specified.
             * @param message CandleUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.CandleUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CandleUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for CandleUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a HistoricalCandles. */
        interface IHistoricalCandles {

            /** HistoricalCandles symbol */
            symbol?: (string|null);

            /** HistoricalCandles timeframe */
            timeframe?: (alg.live.Timeframe|null);

            /** HistoricalCandles candles */
            candles?: (alg.live.ICandleUpdate[]|null);
        }

        /** Represents a HistoricalCandles. */
        class HistoricalCandles implements IHistoricalCandles {

            /**
             * Constructs a new HistoricalCandles.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IHistoricalCandles);

            /** HistoricalCandles symbol. */
            public symbol: string;

            /** HistoricalCandles timeframe. */
            public timeframe: alg.live.Timeframe;

            /** HistoricalCandles candles. */
            public candles: alg.live.ICandleUpdate[];

            /**
             * Creates a new HistoricalCandles instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HistoricalCandles instance
             */
            public static create(properties?: alg.live.IHistoricalCandles): alg.live.HistoricalCandles;

            /**
             * Encodes the specified HistoricalCandles message. Does not implicitly {@link alg.live.HistoricalCandles.verify|verify} messages.
             * @param message HistoricalCandles message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IHistoricalCandles, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HistoricalCandles message, length delimited. Does not implicitly {@link alg.live.HistoricalCandles.verify|verify} messages.
             * @param message HistoricalCandles message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IHistoricalCandles, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HistoricalCandles message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HistoricalCandles
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.HistoricalCandles;

            /**
             * Decodes a HistoricalCandles message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HistoricalCandles
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.HistoricalCandles;

            /**
             * Verifies a HistoricalCandles message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HistoricalCandles message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HistoricalCandles
             */
            public static fromObject(object: { [k: string]: any }): alg.live.HistoricalCandles;

            /**
             * Creates a plain object from a HistoricalCandles message. Also converts values to other types if specified.
             * @param message HistoricalCandles
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.HistoricalCandles, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HistoricalCandles to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for HistoricalCandles
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TradeUpdate. */
        interface ITradeUpdate {

            /** TradeUpdate symbol */
            symbol?: (string|null);

            /** TradeUpdate price */
            price?: (number|Long|null);

            /** TradeUpdate size */
            size?: (number|null);

            /** TradeUpdate aggressor */
            aggressor?: (alg.live.Side|null);

            /** TradeUpdate exchangeTs */
            exchangeTs?: (number|Long|null);

            /** TradeUpdate serverTs */
            serverTs?: (number|Long|null);

            /** TradeUpdate totalVolume */
            totalVolume?: (number|Long|null);

            /** TradeUpdate netChange */
            netChange?: (number|Long|null);

            /** TradeUpdate percentChange */
            percentChange?: (number|Long|null);

            /** TradeUpdate vwap */
            vwap?: (number|Long|null);

            /** TradeUpdate isSnapshot */
            isSnapshot?: (boolean|null);
        }

        /** Represents a TradeUpdate. */
        class TradeUpdate implements ITradeUpdate {

            /**
             * Constructs a new TradeUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ITradeUpdate);

            /** TradeUpdate symbol. */
            public symbol: string;

            /** TradeUpdate price. */
            public price: (number|Long);

            /** TradeUpdate size. */
            public size: number;

            /** TradeUpdate aggressor. */
            public aggressor: alg.live.Side;

            /** TradeUpdate exchangeTs. */
            public exchangeTs: (number|Long);

            /** TradeUpdate serverTs. */
            public serverTs: (number|Long);

            /** TradeUpdate totalVolume. */
            public totalVolume?: (number|Long|null);

            /** TradeUpdate netChange. */
            public netChange?: (number|Long|null);

            /** TradeUpdate percentChange. */
            public percentChange?: (number|Long|null);

            /** TradeUpdate vwap. */
            public vwap?: (number|Long|null);

            /** TradeUpdate isSnapshot. */
            public isSnapshot: boolean;

            /**
             * Creates a new TradeUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TradeUpdate instance
             */
            public static create(properties?: alg.live.ITradeUpdate): alg.live.TradeUpdate;

            /**
             * Encodes the specified TradeUpdate message. Does not implicitly {@link alg.live.TradeUpdate.verify|verify} messages.
             * @param message TradeUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ITradeUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TradeUpdate message, length delimited. Does not implicitly {@link alg.live.TradeUpdate.verify|verify} messages.
             * @param message TradeUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ITradeUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TradeUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TradeUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.TradeUpdate;

            /**
             * Decodes a TradeUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TradeUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.TradeUpdate;

            /**
             * Verifies a TradeUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TradeUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TradeUpdate
             */
            public static fromObject(object: { [k: string]: any }): alg.live.TradeUpdate;

            /**
             * Creates a plain object from a TradeUpdate message. Also converts values to other types if specified.
             * @param message TradeUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.TradeUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TradeUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TradeUpdate
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MarketStats. */
        interface IMarketStats {

            /** MarketStats symbol */
            symbol?: (string|null);

            /** MarketStats lastPrice */
            lastPrice?: (number|Long|null);

            /** MarketStats bid */
            bid?: (number|Long|null);

            /** MarketStats ask */
            ask?: (number|Long|null);

            /** MarketStats bidSize */
            bidSize?: (number|null);

            /** MarketStats askSize */
            askSize?: (number|null);

            /** MarketStats volume */
            volume?: (number|Long|null);

            /** MarketStats netChange */
            netChange?: (number|Long|null);

            /** MarketStats percentChange */
            percentChange?: (number|Long|null);

            /** MarketStats vwap */
            vwap?: (number|Long|null);

            /** MarketStats high */
            high?: (number|Long|null);

            /** MarketStats low */
            low?: (number|Long|null);

            /** MarketStats open */
            open?: (number|Long|null);

            /** MarketStats timestamp */
            timestamp?: (number|Long|null);
        }

        /** Represents a MarketStats. */
        class MarketStats implements IMarketStats {

            /**
             * Constructs a new MarketStats.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IMarketStats);

            /** MarketStats symbol. */
            public symbol: string;

            /** MarketStats lastPrice. */
            public lastPrice: (number|Long);

            /** MarketStats bid. */
            public bid?: (number|Long|null);

            /** MarketStats ask. */
            public ask?: (number|Long|null);

            /** MarketStats bidSize. */
            public bidSize?: (number|null);

            /** MarketStats askSize. */
            public askSize?: (number|null);

            /** MarketStats volume. */
            public volume?: (number|Long|null);

            /** MarketStats netChange. */
            public netChange?: (number|Long|null);

            /** MarketStats percentChange. */
            public percentChange?: (number|Long|null);

            /** MarketStats vwap. */
            public vwap?: (number|Long|null);

            /** MarketStats high. */
            public high?: (number|Long|null);

            /** MarketStats low. */
            public low?: (number|Long|null);

            /** MarketStats open. */
            public open?: (number|Long|null);

            /** MarketStats timestamp. */
            public timestamp: (number|Long);

            /**
             * Creates a new MarketStats instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MarketStats instance
             */
            public static create(properties?: alg.live.IMarketStats): alg.live.MarketStats;

            /**
             * Encodes the specified MarketStats message. Does not implicitly {@link alg.live.MarketStats.verify|verify} messages.
             * @param message MarketStats message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IMarketStats, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MarketStats message, length delimited. Does not implicitly {@link alg.live.MarketStats.verify|verify} messages.
             * @param message MarketStats message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IMarketStats, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MarketStats message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MarketStats
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.MarketStats;

            /**
             * Decodes a MarketStats message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MarketStats
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.MarketStats;

            /**
             * Verifies a MarketStats message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MarketStats message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MarketStats
             */
            public static fromObject(object: { [k: string]: any }): alg.live.MarketStats;

            /**
             * Creates a plain object from a MarketStats message. Also converts values to other types if specified.
             * @param message MarketStats
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.MarketStats, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MarketStats to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MarketStats
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SymbolInfo. */
        interface ISymbolInfo {

            /** SymbolInfo symbol */
            symbol?: (string|null);

            /** SymbolInfo exchange */
            exchange?: (string|null);

            /** SymbolInfo product */
            product?: (string|null);

            /** SymbolInfo tickSize */
            tickSize?: (number|null);

            /** SymbolInfo pointValue */
            pointValue?: (number|null);

            /** SymbolInfo expiration */
            expiration?: (string|null);
        }

        /** Represents a SymbolInfo. */
        class SymbolInfo implements ISymbolInfo {

            /**
             * Constructs a new SymbolInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISymbolInfo);

            /** SymbolInfo symbol. */
            public symbol: string;

            /** SymbolInfo exchange. */
            public exchange: string;

            /** SymbolInfo product. */
            public product: string;

            /** SymbolInfo tickSize. */
            public tickSize?: (number|null);

            /** SymbolInfo pointValue. */
            public pointValue?: (number|null);

            /** SymbolInfo expiration. */
            public expiration?: (string|null);

            /**
             * Creates a new SymbolInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SymbolInfo instance
             */
            public static create(properties?: alg.live.ISymbolInfo): alg.live.SymbolInfo;

            /**
             * Encodes the specified SymbolInfo message. Does not implicitly {@link alg.live.SymbolInfo.verify|verify} messages.
             * @param message SymbolInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISymbolInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SymbolInfo message, length delimited. Does not implicitly {@link alg.live.SymbolInfo.verify|verify} messages.
             * @param message SymbolInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISymbolInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SymbolInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SymbolInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.SymbolInfo;

            /**
             * Decodes a SymbolInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SymbolInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.SymbolInfo;

            /**
             * Verifies a SymbolInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SymbolInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SymbolInfo
             */
            public static fromObject(object: { [k: string]: any }): alg.live.SymbolInfo;

            /**
             * Creates a plain object from a SymbolInfo message. Also converts values to other types if specified.
             * @param message SymbolInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.SymbolInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SymbolInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SymbolInfo
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DepthLevel. */
        interface IDepthLevel {

            /** DepthLevel price */
            price?: (number|Long|null);

            /** DepthLevel size */
            size?: (number|null);

            /** DepthLevel orders */
            orders?: (number|null);
        }

        /** Represents a DepthLevel. */
        class DepthLevel implements IDepthLevel {

            /**
             * Constructs a new DepthLevel.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IDepthLevel);

            /** DepthLevel price. */
            public price: (number|Long);

            /** DepthLevel size. */
            public size: number;

            /** DepthLevel orders. */
            public orders: number;

            /**
             * Creates a new DepthLevel instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DepthLevel instance
             */
            public static create(properties?: alg.live.IDepthLevel): alg.live.DepthLevel;

            /**
             * Encodes the specified DepthLevel message. Does not implicitly {@link alg.live.DepthLevel.verify|verify} messages.
             * @param message DepthLevel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IDepthLevel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DepthLevel message, length delimited. Does not implicitly {@link alg.live.DepthLevel.verify|verify} messages.
             * @param message DepthLevel message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IDepthLevel, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DepthLevel message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DepthLevel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.DepthLevel;

            /**
             * Decodes a DepthLevel message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DepthLevel
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.DepthLevel;

            /**
             * Verifies a DepthLevel message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DepthLevel message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DepthLevel
             */
            public static fromObject(object: { [k: string]: any }): alg.live.DepthLevel;

            /**
             * Creates a plain object from a DepthLevel message. Also converts values to other types if specified.
             * @param message DepthLevel
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.DepthLevel, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DepthLevel to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DepthLevel
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DepthSnapshot. */
        interface IDepthSnapshot {

            /** DepthSnapshot symbol */
            symbol?: (string|null);

            /** DepthSnapshot bids */
            bids?: (alg.live.IDepthLevel[]|null);

            /** DepthSnapshot asks */
            asks?: (alg.live.IDepthLevel[]|null);

            /** DepthSnapshot timestamp */
            timestamp?: (number|Long|null);

            /** DepthSnapshot serverTs */
            serverTs?: (number|Long|null);
        }

        /** Represents a DepthSnapshot. */
        class DepthSnapshot implements IDepthSnapshot {

            /**
             * Constructs a new DepthSnapshot.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IDepthSnapshot);

            /** DepthSnapshot symbol. */
            public symbol: string;

            /** DepthSnapshot bids. */
            public bids: alg.live.IDepthLevel[];

            /** DepthSnapshot asks. */
            public asks: alg.live.IDepthLevel[];

            /** DepthSnapshot timestamp. */
            public timestamp: (number|Long);

            /** DepthSnapshot serverTs. */
            public serverTs: (number|Long);

            /**
             * Creates a new DepthSnapshot instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DepthSnapshot instance
             */
            public static create(properties?: alg.live.IDepthSnapshot): alg.live.DepthSnapshot;

            /**
             * Encodes the specified DepthSnapshot message. Does not implicitly {@link alg.live.DepthSnapshot.verify|verify} messages.
             * @param message DepthSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IDepthSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DepthSnapshot message, length delimited. Does not implicitly {@link alg.live.DepthSnapshot.verify|verify} messages.
             * @param message DepthSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IDepthSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DepthSnapshot message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DepthSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.DepthSnapshot;

            /**
             * Decodes a DepthSnapshot message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DepthSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.DepthSnapshot;

            /**
             * Verifies a DepthSnapshot message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DepthSnapshot message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DepthSnapshot
             */
            public static fromObject(object: { [k: string]: any }): alg.live.DepthSnapshot;

            /**
             * Creates a plain object from a DepthSnapshot message. Also converts values to other types if specified.
             * @param message DepthSnapshot
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.DepthSnapshot, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DepthSnapshot to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DepthSnapshot
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a HistoricalDepth. */
        interface IHistoricalDepth {

            /** HistoricalDepth symbol */
            symbol?: (string|null);

            /** HistoricalDepth snapshots */
            snapshots?: (alg.live.IDepthSnapshot[]|null);
        }

        /** Represents a HistoricalDepth. */
        class HistoricalDepth implements IHistoricalDepth {

            /**
             * Constructs a new HistoricalDepth.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IHistoricalDepth);

            /** HistoricalDepth symbol. */
            public symbol: string;

            /** HistoricalDepth snapshots. */
            public snapshots: alg.live.IDepthSnapshot[];

            /**
             * Creates a new HistoricalDepth instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HistoricalDepth instance
             */
            public static create(properties?: alg.live.IHistoricalDepth): alg.live.HistoricalDepth;

            /**
             * Encodes the specified HistoricalDepth message. Does not implicitly {@link alg.live.HistoricalDepth.verify|verify} messages.
             * @param message HistoricalDepth message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IHistoricalDepth, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HistoricalDepth message, length delimited. Does not implicitly {@link alg.live.HistoricalDepth.verify|verify} messages.
             * @param message HistoricalDepth message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IHistoricalDepth, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HistoricalDepth message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HistoricalDepth
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.HistoricalDepth;

            /**
             * Decodes a HistoricalDepth message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HistoricalDepth
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.HistoricalDepth;

            /**
             * Verifies a HistoricalDepth message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HistoricalDepth message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HistoricalDepth
             */
            public static fromObject(object: { [k: string]: any }): alg.live.HistoricalDepth;

            /**
             * Creates a plain object from a HistoricalDepth message. Also converts values to other types if specified.
             * @param message HistoricalDepth
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.HistoricalDepth, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HistoricalDepth to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for HistoricalDepth
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an AvailableSymbols. */
        interface IAvailableSymbols {

            /** AvailableSymbols symbols */
            symbols?: (alg.live.ISymbolInfo[]|null);
        }

        /** Represents an AvailableSymbols. */
        class AvailableSymbols implements IAvailableSymbols {

            /**
             * Constructs a new AvailableSymbols.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IAvailableSymbols);

            /** AvailableSymbols symbols. */
            public symbols: alg.live.ISymbolInfo[];

            /**
             * Creates a new AvailableSymbols instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AvailableSymbols instance
             */
            public static create(properties?: alg.live.IAvailableSymbols): alg.live.AvailableSymbols;

            /**
             * Encodes the specified AvailableSymbols message. Does not implicitly {@link alg.live.AvailableSymbols.verify|verify} messages.
             * @param message AvailableSymbols message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IAvailableSymbols, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AvailableSymbols message, length delimited. Does not implicitly {@link alg.live.AvailableSymbols.verify|verify} messages.
             * @param message AvailableSymbols message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IAvailableSymbols, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AvailableSymbols message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns AvailableSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.AvailableSymbols;

            /**
             * Decodes an AvailableSymbols message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns AvailableSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.AvailableSymbols;

            /**
             * Verifies an AvailableSymbols message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AvailableSymbols message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AvailableSymbols
             */
            public static fromObject(object: { [k: string]: any }): alg.live.AvailableSymbols;

            /**
             * Creates a plain object from an AvailableSymbols message. Also converts values to other types if specified.
             * @param message AvailableSymbols
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.AvailableSymbols, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AvailableSymbols to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for AvailableSymbols
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SymbolSearchResult. */
        interface ISymbolSearchResult {

            /** SymbolSearchResult symbols */
            symbols?: (string[]|null);

            /** SymbolSearchResult searchText */
            searchText?: (string|null);
        }

        /** Represents a SymbolSearchResult. */
        class SymbolSearchResult implements ISymbolSearchResult {

            /**
             * Constructs a new SymbolSearchResult.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISymbolSearchResult);

            /** SymbolSearchResult symbols. */
            public symbols: string[];

            /** SymbolSearchResult searchText. */
            public searchText: string;

            /**
             * Creates a new SymbolSearchResult instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SymbolSearchResult instance
             */
            public static create(properties?: alg.live.ISymbolSearchResult): alg.live.SymbolSearchResult;

            /**
             * Encodes the specified SymbolSearchResult message. Does not implicitly {@link alg.live.SymbolSearchResult.verify|verify} messages.
             * @param message SymbolSearchResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISymbolSearchResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SymbolSearchResult message, length delimited. Does not implicitly {@link alg.live.SymbolSearchResult.verify|verify} messages.
             * @param message SymbolSearchResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISymbolSearchResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SymbolSearchResult message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SymbolSearchResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.SymbolSearchResult;

            /**
             * Decodes a SymbolSearchResult message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SymbolSearchResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.SymbolSearchResult;

            /**
             * Verifies a SymbolSearchResult message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SymbolSearchResult message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SymbolSearchResult
             */
            public static fromObject(object: { [k: string]: any }): alg.live.SymbolSearchResult;

            /**
             * Creates a plain object from a SymbolSearchResult message. Also converts values to other types if specified.
             * @param message SymbolSearchResult
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.SymbolSearchResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SymbolSearchResult to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SymbolSearchResult
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Subscribe. */
        interface ISubscribe {

            /** Subscribe symbol */
            symbol?: (string|null);

            /** Subscribe exchange */
            exchange?: (string|null);

            /** Subscribe timeframe */
            timeframe?: (alg.live.Timeframe|null);

            /** Subscribe historicalSource */
            historicalSource?: (alg.live.HistoricalSource|null);

            /** Subscribe historicalCount */
            historicalCount?: (number|null);
        }

        /** Represents a Subscribe. */
        class Subscribe implements ISubscribe {

            /**
             * Constructs a new Subscribe.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISubscribe);

            /** Subscribe symbol. */
            public symbol: string;

            /** Subscribe exchange. */
            public exchange: string;

            /** Subscribe timeframe. */
            public timeframe: alg.live.Timeframe;

            /** Subscribe historicalSource. */
            public historicalSource: alg.live.HistoricalSource;

            /** Subscribe historicalCount. */
            public historicalCount: number;

            /**
             * Creates a new Subscribe instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Subscribe instance
             */
            public static create(properties?: alg.live.ISubscribe): alg.live.Subscribe;

            /**
             * Encodes the specified Subscribe message. Does not implicitly {@link alg.live.Subscribe.verify|verify} messages.
             * @param message Subscribe message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISubscribe, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Subscribe message, length delimited. Does not implicitly {@link alg.live.Subscribe.verify|verify} messages.
             * @param message Subscribe message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISubscribe, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Subscribe message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Subscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.Subscribe;

            /**
             * Decodes a Subscribe message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Subscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.Subscribe;

            /**
             * Verifies a Subscribe message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Subscribe message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Subscribe
             */
            public static fromObject(object: { [k: string]: any }): alg.live.Subscribe;

            /**
             * Creates a plain object from a Subscribe message. Also converts values to other types if specified.
             * @param message Subscribe
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.Subscribe, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Subscribe to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Subscribe
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an Unsubscribe. */
        interface IUnsubscribe {

            /** Unsubscribe symbol */
            symbol?: (string|null);
        }

        /** Represents an Unsubscribe. */
        class Unsubscribe implements IUnsubscribe {

            /**
             * Constructs a new Unsubscribe.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IUnsubscribe);

            /** Unsubscribe symbol. */
            public symbol: string;

            /**
             * Creates a new Unsubscribe instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Unsubscribe instance
             */
            public static create(properties?: alg.live.IUnsubscribe): alg.live.Unsubscribe;

            /**
             * Encodes the specified Unsubscribe message. Does not implicitly {@link alg.live.Unsubscribe.verify|verify} messages.
             * @param message Unsubscribe message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IUnsubscribe, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Unsubscribe message, length delimited. Does not implicitly {@link alg.live.Unsubscribe.verify|verify} messages.
             * @param message Unsubscribe message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IUnsubscribe, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Unsubscribe message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Unsubscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.Unsubscribe;

            /**
             * Decodes an Unsubscribe message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Unsubscribe
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.Unsubscribe;

            /**
             * Verifies an Unsubscribe message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Unsubscribe message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Unsubscribe
             */
            public static fromObject(object: { [k: string]: any }): alg.live.Unsubscribe;

            /**
             * Creates a plain object from an Unsubscribe message. Also converts values to other types if specified.
             * @param message Unsubscribe
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.Unsubscribe, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Unsubscribe to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Unsubscribe
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Subscribed. */
        interface ISubscribed {

            /** Subscribed symbol */
            symbol?: (string|null);

            /** Subscribed timeframe */
            timeframe?: (alg.live.Timeframe|null);
        }

        /** Represents a Subscribed. */
        class Subscribed implements ISubscribed {

            /**
             * Constructs a new Subscribed.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISubscribed);

            /** Subscribed symbol. */
            public symbol: string;

            /** Subscribed timeframe. */
            public timeframe: alg.live.Timeframe;

            /**
             * Creates a new Subscribed instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Subscribed instance
             */
            public static create(properties?: alg.live.ISubscribed): alg.live.Subscribed;

            /**
             * Encodes the specified Subscribed message. Does not implicitly {@link alg.live.Subscribed.verify|verify} messages.
             * @param message Subscribed message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISubscribed, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Subscribed message, length delimited. Does not implicitly {@link alg.live.Subscribed.verify|verify} messages.
             * @param message Subscribed message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISubscribed, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Subscribed message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Subscribed
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.Subscribed;

            /**
             * Decodes a Subscribed message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Subscribed
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.Subscribed;

            /**
             * Verifies a Subscribed message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Subscribed message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Subscribed
             */
            public static fromObject(object: { [k: string]: any }): alg.live.Subscribed;

            /**
             * Creates a plain object from a Subscribed message. Also converts values to other types if specified.
             * @param message Subscribed
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.Subscribed, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Subscribed to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Subscribed
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SearchSymbols. */
        interface ISearchSymbols {

            /** SearchSymbols searchText */
            searchText?: (string|null);

            /** SearchSymbols exchange */
            exchange?: (string|null);
        }

        /** Represents a SearchSymbols. */
        class SearchSymbols implements ISearchSymbols {

            /**
             * Constructs a new SearchSymbols.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISearchSymbols);

            /** SearchSymbols searchText. */
            public searchText: string;

            /** SearchSymbols exchange. */
            public exchange?: (string|null);

            /**
             * Creates a new SearchSymbols instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SearchSymbols instance
             */
            public static create(properties?: alg.live.ISearchSymbols): alg.live.SearchSymbols;

            /**
             * Encodes the specified SearchSymbols message. Does not implicitly {@link alg.live.SearchSymbols.verify|verify} messages.
             * @param message SearchSymbols message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISearchSymbols, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SearchSymbols message, length delimited. Does not implicitly {@link alg.live.SearchSymbols.verify|verify} messages.
             * @param message SearchSymbols message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISearchSymbols, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SearchSymbols message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SearchSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.SearchSymbols;

            /**
             * Decodes a SearchSymbols message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SearchSymbols
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.SearchSymbols;

            /**
             * Verifies a SearchSymbols message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SearchSymbols message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SearchSymbols
             */
            public static fromObject(object: { [k: string]: any }): alg.live.SearchSymbols;

            /**
             * Creates a plain object from a SearchSymbols message. Also converts values to other types if specified.
             * @param message SearchSymbols
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.SearchSymbols, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SearchSymbols to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SearchSymbols
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SetMode. */
        interface ISetMode {

            /** SetMode dataMode */
            dataMode?: (alg.live.DataMode|null);

            /** SetMode tradeMode */
            tradeMode?: (alg.live.TradeMode|null);

            /** SetMode dataProvider */
            dataProvider?: (alg.live.DataProvider|null);
        }

        /** Represents a SetMode. */
        class SetMode implements ISetMode {

            /**
             * Constructs a new SetMode.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISetMode);

            /** SetMode dataMode. */
            public dataMode: alg.live.DataMode;

            /** SetMode tradeMode. */
            public tradeMode: alg.live.TradeMode;

            /** SetMode dataProvider. */
            public dataProvider: alg.live.DataProvider;

            /**
             * Creates a new SetMode instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetMode instance
             */
            public static create(properties?: alg.live.ISetMode): alg.live.SetMode;

            /**
             * Encodes the specified SetMode message. Does not implicitly {@link alg.live.SetMode.verify|verify} messages.
             * @param message SetMode message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISetMode, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetMode message, length delimited. Does not implicitly {@link alg.live.SetMode.verify|verify} messages.
             * @param message SetMode message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISetMode, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetMode message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SetMode
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.SetMode;

            /**
             * Decodes a SetMode message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SetMode
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.SetMode;

            /**
             * Verifies a SetMode message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetMode message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetMode
             */
            public static fromObject(object: { [k: string]: any }): alg.live.SetMode;

            /**
             * Creates a plain object from a SetMode message. Also converts values to other types if specified.
             * @param message SetMode
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.SetMode, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetMode to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SetMode
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ModeChanged. */
        interface IModeChanged {

            /** ModeChanged dataMode */
            dataMode?: (alg.live.DataMode|null);

            /** ModeChanged tradeMode */
            tradeMode?: (alg.live.TradeMode|null);

            /** ModeChanged error */
            error?: (string|null);

            /** ModeChanged dataProvider */
            dataProvider?: (alg.live.DataProvider|null);
        }

        /** Represents a ModeChanged. */
        class ModeChanged implements IModeChanged {

            /**
             * Constructs a new ModeChanged.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IModeChanged);

            /** ModeChanged dataMode. */
            public dataMode: alg.live.DataMode;

            /** ModeChanged tradeMode. */
            public tradeMode: alg.live.TradeMode;

            /** ModeChanged error. */
            public error?: (string|null);

            /** ModeChanged dataProvider. */
            public dataProvider: alg.live.DataProvider;

            /**
             * Creates a new ModeChanged instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ModeChanged instance
             */
            public static create(properties?: alg.live.IModeChanged): alg.live.ModeChanged;

            /**
             * Encodes the specified ModeChanged message. Does not implicitly {@link alg.live.ModeChanged.verify|verify} messages.
             * @param message ModeChanged message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IModeChanged, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ModeChanged message, length delimited. Does not implicitly {@link alg.live.ModeChanged.verify|verify} messages.
             * @param message ModeChanged message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IModeChanged, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ModeChanged message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ModeChanged
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.ModeChanged;

            /**
             * Decodes a ModeChanged message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ModeChanged
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.ModeChanged;

            /**
             * Verifies a ModeChanged message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ModeChanged message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ModeChanged
             */
            public static fromObject(object: { [k: string]: any }): alg.live.ModeChanged;

            /**
             * Creates a plain object from a ModeChanged message. Also converts values to other types if specified.
             * @param message ModeChanged
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.ModeChanged, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ModeChanged to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ModeChanged
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SetUpdateInterval. */
        interface ISetUpdateInterval {

            /** SetUpdateInterval intervalMs */
            intervalMs?: (number|null);
        }

        /** Represents a SetUpdateInterval. */
        class SetUpdateInterval implements ISetUpdateInterval {

            /**
             * Constructs a new SetUpdateInterval.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISetUpdateInterval);

            /** SetUpdateInterval intervalMs. */
            public intervalMs: number;

            /**
             * Creates a new SetUpdateInterval instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetUpdateInterval instance
             */
            public static create(properties?: alg.live.ISetUpdateInterval): alg.live.SetUpdateInterval;

            /**
             * Encodes the specified SetUpdateInterval message. Does not implicitly {@link alg.live.SetUpdateInterval.verify|verify} messages.
             * @param message SetUpdateInterval message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISetUpdateInterval, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetUpdateInterval message, length delimited. Does not implicitly {@link alg.live.SetUpdateInterval.verify|verify} messages.
             * @param message SetUpdateInterval message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISetUpdateInterval, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetUpdateInterval message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SetUpdateInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.SetUpdateInterval;

            /**
             * Decodes a SetUpdateInterval message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SetUpdateInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.SetUpdateInterval;

            /**
             * Verifies a SetUpdateInterval message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetUpdateInterval message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetUpdateInterval
             */
            public static fromObject(object: { [k: string]: any }): alg.live.SetUpdateInterval;

            /**
             * Creates a plain object from a SetUpdateInterval message. Also converts values to other types if specified.
             * @param message SetUpdateInterval
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.SetUpdateInterval, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetUpdateInterval to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SetUpdateInterval
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SetDepthConfig. */
        interface ISetDepthConfig {

            /** SetDepthConfig depthIntervalMs */
            depthIntervalMs?: (number|null);
        }

        /** Represents a SetDepthConfig. */
        class SetDepthConfig implements ISetDepthConfig {

            /**
             * Constructs a new SetDepthConfig.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ISetDepthConfig);

            /** SetDepthConfig depthIntervalMs. */
            public depthIntervalMs: number;

            /**
             * Creates a new SetDepthConfig instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SetDepthConfig instance
             */
            public static create(properties?: alg.live.ISetDepthConfig): alg.live.SetDepthConfig;

            /**
             * Encodes the specified SetDepthConfig message. Does not implicitly {@link alg.live.SetDepthConfig.verify|verify} messages.
             * @param message SetDepthConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ISetDepthConfig, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SetDepthConfig message, length delimited. Does not implicitly {@link alg.live.SetDepthConfig.verify|verify} messages.
             * @param message SetDepthConfig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ISetDepthConfig, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SetDepthConfig message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SetDepthConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.SetDepthConfig;

            /**
             * Decodes a SetDepthConfig message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SetDepthConfig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.SetDepthConfig;

            /**
             * Verifies a SetDepthConfig message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SetDepthConfig message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SetDepthConfig
             */
            public static fromObject(object: { [k: string]: any }): alg.live.SetDepthConfig;

            /**
             * Creates a plain object from a SetDepthConfig message. Also converts values to other types if specified.
             * @param message SetDepthConfig
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.SetDepthConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SetDepthConfig to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SetDepthConfig
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConnectionStatus. */
        interface IConnectionStatus {

            /** ConnectionStatus dataMode */
            dataMode?: (alg.live.DataMode|null);

            /** ConnectionStatus tradeMode */
            tradeMode?: (alg.live.TradeMode|null);

            /** ConnectionStatus connected */
            connected?: (boolean|null);

            /** ConnectionStatus feedLatencyUs */
            feedLatencyUs?: (number|Long|null);

            /** ConnectionStatus dataProvider */
            dataProvider?: (alg.live.DataProvider|null);
        }

        /** Represents a ConnectionStatus. */
        class ConnectionStatus implements IConnectionStatus {

            /**
             * Constructs a new ConnectionStatus.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IConnectionStatus);

            /** ConnectionStatus dataMode. */
            public dataMode: alg.live.DataMode;

            /** ConnectionStatus tradeMode. */
            public tradeMode: alg.live.TradeMode;

            /** ConnectionStatus connected. */
            public connected: boolean;

            /** ConnectionStatus feedLatencyUs. */
            public feedLatencyUs?: (number|Long|null);

            /** ConnectionStatus dataProvider. */
            public dataProvider: alg.live.DataProvider;

            /**
             * Creates a new ConnectionStatus instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConnectionStatus instance
             */
            public static create(properties?: alg.live.IConnectionStatus): alg.live.ConnectionStatus;

            /**
             * Encodes the specified ConnectionStatus message. Does not implicitly {@link alg.live.ConnectionStatus.verify|verify} messages.
             * @param message ConnectionStatus message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IConnectionStatus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConnectionStatus message, length delimited. Does not implicitly {@link alg.live.ConnectionStatus.verify|verify} messages.
             * @param message ConnectionStatus message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IConnectionStatus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConnectionStatus message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConnectionStatus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.ConnectionStatus;

            /**
             * Decodes a ConnectionStatus message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConnectionStatus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.ConnectionStatus;

            /**
             * Verifies a ConnectionStatus message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConnectionStatus message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConnectionStatus
             */
            public static fromObject(object: { [k: string]: any }): alg.live.ConnectionStatus;

            /**
             * Creates a plain object from a ConnectionStatus message. Also converts values to other types if specified.
             * @param message ConnectionStatus
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.ConnectionStatus, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConnectionStatus to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConnectionStatus
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Capabilities. */
        interface ICapabilities {

            /** Capabilities mockEnabled */
            mockEnabled?: (boolean|null);

            /** Capabilities rithmicEnabled */
            rithmicEnabled?: (boolean|null);

            /** Capabilities tradingEnabled */
            tradingEnabled?: (boolean|null);

            /** Capabilities availableBrokers */
            availableBrokers?: (string[]|null);

            /** Capabilities userHasCredentials */
            userHasCredentials?: ({ [k: string]: boolean }|null);

            /** Capabilities databentoEnabled */
            databentoEnabled?: (boolean|null);
        }

        /** Represents a Capabilities. */
        class Capabilities implements ICapabilities {

            /**
             * Constructs a new Capabilities.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.ICapabilities);

            /** Capabilities mockEnabled. */
            public mockEnabled: boolean;

            /** Capabilities rithmicEnabled. */
            public rithmicEnabled: boolean;

            /** Capabilities tradingEnabled. */
            public tradingEnabled: boolean;

            /** Capabilities availableBrokers. */
            public availableBrokers: string[];

            /** Capabilities userHasCredentials. */
            public userHasCredentials: { [k: string]: boolean };

            /** Capabilities databentoEnabled. */
            public databentoEnabled: boolean;

            /**
             * Creates a new Capabilities instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Capabilities instance
             */
            public static create(properties?: alg.live.ICapabilities): alg.live.Capabilities;

            /**
             * Encodes the specified Capabilities message. Does not implicitly {@link alg.live.Capabilities.verify|verify} messages.
             * @param message Capabilities message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.ICapabilities, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Capabilities message, length delimited. Does not implicitly {@link alg.live.Capabilities.verify|verify} messages.
             * @param message Capabilities message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.ICapabilities, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Capabilities message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Capabilities
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.Capabilities;

            /**
             * Decodes a Capabilities message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Capabilities
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.Capabilities;

            /**
             * Verifies a Capabilities message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Capabilities message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Capabilities
             */
            public static fromObject(object: { [k: string]: any }): alg.live.Capabilities;

            /**
             * Creates a plain object from a Capabilities message. Also converts values to other types if specified.
             * @param message Capabilities
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.Capabilities, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Capabilities to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Capabilities
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an Error. */
        interface IError {

            /** Error code */
            code?: (string|null);

            /** Error message */
            message?: (string|null);

            /** Error requestId */
            requestId?: (string|null);
        }

        /** Represents an Error. */
        class Error implements IError {

            /**
             * Constructs a new Error.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IError);

            /** Error code. */
            public code: string;

            /** Error message. */
            public message: string;

            /** Error requestId. */
            public requestId?: (string|null);

            /**
             * Creates a new Error instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Error instance
             */
            public static create(properties?: alg.live.IError): alg.live.Error;

            /**
             * Encodes the specified Error message. Does not implicitly {@link alg.live.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link alg.live.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.Error;

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.Error;

            /**
             * Verifies an Error message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Error
             */
            public static fromObject(object: { [k: string]: any }): alg.live.Error;

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @param message Error
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.Error, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Error to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Error
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ClientMessage. */
        interface IClientMessage {

            /** ClientMessage subscribe */
            subscribe?: (alg.live.ISubscribe|null);

            /** ClientMessage unsubscribe */
            unsubscribe?: (alg.live.IUnsubscribe|null);

            /** ClientMessage searchSymbols */
            searchSymbols?: (alg.live.ISearchSymbols|null);

            /** ClientMessage placeOrder */
            placeOrder?: (alg.live.IPlaceOrder|null);

            /** ClientMessage placeBracket */
            placeBracket?: (alg.live.IPlaceBracket|null);

            /** ClientMessage modifyOrder */
            modifyOrder?: (alg.live.IModifyOrder|null);

            /** ClientMessage cancelOrder */
            cancelOrder?: (alg.live.ICancelOrder|null);

            /** ClientMessage setUpdateInterval */
            setUpdateInterval?: (alg.live.ISetUpdateInterval|null);

            /** ClientMessage setMode */
            setMode?: (alg.live.ISetMode|null);

            /** ClientMessage setDepthConfig */
            setDepthConfig?: (alg.live.ISetDepthConfig|null);
        }

        /** Represents a ClientMessage. */
        class ClientMessage implements IClientMessage {

            /**
             * Constructs a new ClientMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IClientMessage);

            /** ClientMessage subscribe. */
            public subscribe?: (alg.live.ISubscribe|null);

            /** ClientMessage unsubscribe. */
            public unsubscribe?: (alg.live.IUnsubscribe|null);

            /** ClientMessage searchSymbols. */
            public searchSymbols?: (alg.live.ISearchSymbols|null);

            /** ClientMessage placeOrder. */
            public placeOrder?: (alg.live.IPlaceOrder|null);

            /** ClientMessage placeBracket. */
            public placeBracket?: (alg.live.IPlaceBracket|null);

            /** ClientMessage modifyOrder. */
            public modifyOrder?: (alg.live.IModifyOrder|null);

            /** ClientMessage cancelOrder. */
            public cancelOrder?: (alg.live.ICancelOrder|null);

            /** ClientMessage setUpdateInterval. */
            public setUpdateInterval?: (alg.live.ISetUpdateInterval|null);

            /** ClientMessage setMode. */
            public setMode?: (alg.live.ISetMode|null);

            /** ClientMessage setDepthConfig. */
            public setDepthConfig?: (alg.live.ISetDepthConfig|null);

            /** ClientMessage payload. */
            public payload?: ("subscribe"|"unsubscribe"|"searchSymbols"|"placeOrder"|"placeBracket"|"modifyOrder"|"cancelOrder"|"setUpdateInterval"|"setMode"|"setDepthConfig");

            /**
             * Creates a new ClientMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ClientMessage instance
             */
            public static create(properties?: alg.live.IClientMessage): alg.live.ClientMessage;

            /**
             * Encodes the specified ClientMessage message. Does not implicitly {@link alg.live.ClientMessage.verify|verify} messages.
             * @param message ClientMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IClientMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ClientMessage message, length delimited. Does not implicitly {@link alg.live.ClientMessage.verify|verify} messages.
             * @param message ClientMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IClientMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ClientMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.ClientMessage;

            /**
             * Decodes a ClientMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.ClientMessage;

            /**
             * Verifies a ClientMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ClientMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ClientMessage
             */
            public static fromObject(object: { [k: string]: any }): alg.live.ClientMessage;

            /**
             * Creates a plain object from a ClientMessage message. Also converts values to other types if specified.
             * @param message ClientMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.ClientMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ClientMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ClientMessage
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServerMessage. */
        interface IServerMessage {

            /** ServerMessage candle */
            candle?: (alg.live.ICandleUpdate|null);

            /** ServerMessage historical */
            historical?: (alg.live.IHistoricalCandles|null);

            /** ServerMessage subscribed */
            subscribed?: (alg.live.ISubscribed|null);

            /** ServerMessage symbolSearchResult */
            symbolSearchResult?: (alg.live.ISymbolSearchResult|null);

            /** ServerMessage availableSymbols */
            availableSymbols?: (alg.live.IAvailableSymbols|null);

            /** ServerMessage trade */
            trade?: (alg.live.ITradeUpdate|null);

            /** ServerMessage marketStats */
            marketStats?: (alg.live.IMarketStats|null);

            /** ServerMessage depth */
            depth?: (alg.live.IDepthSnapshot|null);

            /** ServerMessage historicalDepth */
            historicalDepth?: (alg.live.IHistoricalDepth|null);

            /** ServerMessage order */
            order?: (alg.live.IOrderUpdate|null);

            /** ServerMessage position */
            position?: (alg.live.IPositionUpdate|null);

            /** ServerMessage account */
            account?: (alg.live.IAccountUpdate|null);

            /** ServerMessage snapshot */
            snapshot?: (alg.live.ISnapshot|null);

            /** ServerMessage error */
            error?: (alg.live.IError|null);

            /** ServerMessage modeChanged */
            modeChanged?: (alg.live.IModeChanged|null);

            /** ServerMessage capabilities */
            capabilities?: (alg.live.ICapabilities|null);

            /** ServerMessage connectionStatus */
            connectionStatus?: (alg.live.IConnectionStatus|null);
        }

        /** Represents a ServerMessage. */
        class ServerMessage implements IServerMessage {

            /**
             * Constructs a new ServerMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: alg.live.IServerMessage);

            /** ServerMessage candle. */
            public candle?: (alg.live.ICandleUpdate|null);

            /** ServerMessage historical. */
            public historical?: (alg.live.IHistoricalCandles|null);

            /** ServerMessage subscribed. */
            public subscribed?: (alg.live.ISubscribed|null);

            /** ServerMessage symbolSearchResult. */
            public symbolSearchResult?: (alg.live.ISymbolSearchResult|null);

            /** ServerMessage availableSymbols. */
            public availableSymbols?: (alg.live.IAvailableSymbols|null);

            /** ServerMessage trade. */
            public trade?: (alg.live.ITradeUpdate|null);

            /** ServerMessage marketStats. */
            public marketStats?: (alg.live.IMarketStats|null);

            /** ServerMessage depth. */
            public depth?: (alg.live.IDepthSnapshot|null);

            /** ServerMessage historicalDepth. */
            public historicalDepth?: (alg.live.IHistoricalDepth|null);

            /** ServerMessage order. */
            public order?: (alg.live.IOrderUpdate|null);

            /** ServerMessage position. */
            public position?: (alg.live.IPositionUpdate|null);

            /** ServerMessage account. */
            public account?: (alg.live.IAccountUpdate|null);

            /** ServerMessage snapshot. */
            public snapshot?: (alg.live.ISnapshot|null);

            /** ServerMessage error. */
            public error?: (alg.live.IError|null);

            /** ServerMessage modeChanged. */
            public modeChanged?: (alg.live.IModeChanged|null);

            /** ServerMessage capabilities. */
            public capabilities?: (alg.live.ICapabilities|null);

            /** ServerMessage connectionStatus. */
            public connectionStatus?: (alg.live.IConnectionStatus|null);

            /** ServerMessage payload. */
            public payload?: ("candle"|"historical"|"subscribed"|"symbolSearchResult"|"availableSymbols"|"trade"|"marketStats"|"depth"|"historicalDepth"|"order"|"position"|"account"|"snapshot"|"error"|"modeChanged"|"capabilities"|"connectionStatus");

            /**
             * Creates a new ServerMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServerMessage instance
             */
            public static create(properties?: alg.live.IServerMessage): alg.live.ServerMessage;

            /**
             * Encodes the specified ServerMessage message. Does not implicitly {@link alg.live.ServerMessage.verify|verify} messages.
             * @param message ServerMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: alg.live.IServerMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServerMessage message, length delimited. Does not implicitly {@link alg.live.ServerMessage.verify|verify} messages.
             * @param message ServerMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: alg.live.IServerMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServerMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServerMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): alg.live.ServerMessage;

            /**
             * Decodes a ServerMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServerMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): alg.live.ServerMessage;

            /**
             * Verifies a ServerMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServerMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServerMessage
             */
            public static fromObject(object: { [k: string]: any }): alg.live.ServerMessage;

            /**
             * Creates a plain object from a ServerMessage message. Also converts values to other types if specified.
             * @param message ServerMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: alg.live.ServerMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServerMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ServerMessage
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
