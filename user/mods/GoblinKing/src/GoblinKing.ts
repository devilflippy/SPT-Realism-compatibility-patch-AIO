/* eslint-disable @typescript-eslint/naming-convention */
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { IBarterScheme, ITraderAssort, ITraderBase } from "@spt-aki/models/eft/common/tables/ITrader";
import { IAkiProfile, WeaponBuild } from "@spt-aki/models/eft/profile/IAkiProfile";
//import { IQuest } from "@spt-aki/models/eft/common/tables/IQuest";
import { QuestController } from "../controllers/QuestController";
//import { QuestHelper } from "../helpers/QuestHelper";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { Money } from "@spt-aki/models/enums/Money";
import { QuestRewardType } from "@spt-aki/models/enums/QuestRewardType";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IRagfairConfig } from "@spt-aki/models/spt/config/IRagfairConfig";
import { ITraderConfig, UpdateTime } from "@spt-aki/models/spt/config/ITraderConfig";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { ImageRouter } from "@spt-aki/routers/ImageRouter";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { RagfairPriceService } from "@spt-aki/services/RagfairPriceService";
import { ImporterUtil } from "@spt-aki/utils/ImporterUtil";
import { DependencyContainer, Lifecycle } from "tsyringe";
import { StolenNecroCode } from "./StolenNecroCode";
import { Traders } from "@spt-aki/models/enums/Traders";


import * as ConfigJson from "../config/config.json";
import * as GoblinKingJson from "../db/GoblinKing.json";
import * as QuestAssortJson from "../db/questassort.json";
import * as QuestValuesCollectorJson from "../db/questValuesCollector.json";

class GoblinKing implements IPreAkiLoadMod, IPostDBLoadMod 
{
    modName: string;
    logger: ILogger;
    mydb: any;

    constructor() 
    {
        this.modName = "GoblinKing";
    }

    preAkiLoad(container: DependencyContainer): void 
    {
        //JustNU's Russian Sorcery - For we too have very specific goals. 
        container.register("StolenNecroCode", StolenNecroCode, {lifecycle: Lifecycle.Singleton});
        //
        this.logger = container.resolve<ILogger>("WinstonLogger");

        this.logger.debug(`[${this.modName}] preAki Loading... `);

        this.setupTraderUpdateTime(container);
        this.registerProfileImage(container);
        this.registerStaticRouter(container);
        //Chomp made me add this to get messages to work. Say "thank you." In Sicilia we say, "vaffenculo," In Espania we say, "vete a la mierda."
        Traders[GoblinKingJson._id] = GoblinKingJson._id;

        this.logger.debug(`[${this.modName}] preAki Loaded`);
    }

    postDBLoad(container: DependencyContainer): void 
    {
        this.logger.debug(`[${this.modName}] postDB Loading... `);

        this.loadMyDB(container);

        this.add556SludgeToGuns(container);
        this.addQuestZones(container);
        this.addTraderToDb(container);
        this.addTraderToLocales(
            container,
            GoblinKingJson.name,
            "Goblin",
            GoblinKingJson.nickname,
            GoblinKingJson.location,
            "Originally from El Paso, Texas. Oscar Vasquez ended up in Tarkov during a supply drop off during the Contract Wars when his chopper was shot down by anti air missles. Unable to get home Oscar decided to take advantage of the crisis in the region setting up a network of medical supplies and storage. Don't be fooled by his cheery candor. Oscar isn't particular with how he gains product and will use any means necessary. Many question his true motive and goal in Norvinsk and his prices aren't exactly fair. This reputation and being only five foot five, earned him the nickname 'Goblin'"
        );
        this.addTraderToFleaMarket(container);
        this.addItemsToDb(container);
        this.addItemsToLocales(container);
        this.addHandbookToDb(container);
        this.addBuffsToDb(container);

        this.logger.debug(`[${this.modName}] postDB Loaded`);

        this.logger.log(`[${this.modName}] Goblin King Active`, LogTextColor.GREEN);
        this.logger.log(`[${this.modName}] Necromancy Successful, StolenNecroCode based on JuseNUCore`, LogTextColor.GREEN);
        this.logger.log(`[${this.modName}] Please report bugs in the mod's comments or support thread.`, LogTextColor.GREEN);
        this.logger.log(`[${this.modName}] Special thanks to Dirtbikercj for updating the QuestAPI`, LogTextColor.GREEN);
        this.logger.log(`[${this.modName}] Pour one for the dead homies`, LogTextColor.GREEN);
    }

    private setupTraderUpdateTime(container: DependencyContainer): void 
    {
        const configServer: ConfigServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        const updateTime: UpdateTime = {
            traderId: GoblinKingJson._id,
            seconds: 3600
        };
        traderConfig.updateTime.push(updateTime);
    }

    private registerProfileImage(container: DependencyContainer): void 
    {
        const preAkiModLoader: PreAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter");

        const imageFilepath = `./${preAkiModLoader.getModPath(this.modName)}res`;
        imageRouter.addRoute(GoblinKingJson.avatar.replace(".png", ""), `${imageFilepath}/GoblinKingMidJourneythumbnail.png`);
    }

    private registerStaticRouter(container: DependencyContainer): void 
    {
        const staticRouterModService: StaticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");

        staticRouterModService.registerStaticRouter(
            "GoblinKingUpdateLogin",
            [
                {
                    url: "/launcher/profile/login",
                    action: (url: string, info: any, sessionId: string, output: string) => 
                    {
                        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
                        const databaseTables: IDatabaseTables = databaseServer.getTables();
                        databaseTables.traders[GoblinKingJson._id].assort = this.createAssortTable(container, sessionId);
                        return output;
                    }
                }
            ],
            "aki"
        );
        staticRouterModService.registerStaticRouter(
            "GoblinKingUpdate",
            [
                {
                    url: "/client/game/profile/items/moving",
                    action: (url: string, info: any, sessionId: string, output: string) => 
                    {
                        if (info.data[0].Action != "Examine") 
                        {
                            const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
                            const databaseTables: IDatabaseTables = databaseServer.getTables();
                            databaseTables.traders[GoblinKingJson._id].assort = this.createAssortTable(container, sessionId);
                        }
                        return output;
                    }
                }
            ],
            "aki"
        );
    }

    private addSingleItemToAssortWithBarterScheme(assortTable: ITraderAssort, itemTpl: string, unlimitedCount: boolean, stackCount: number, loyaltyLevel: number, barterSchemes: IBarterScheme[][]): void 
    {
        const newItem: Item = {
            _id: itemTpl,
            _tpl: itemTpl,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: unlimitedCount,
                StackObjectsCount: stackCount
            }
        };
        assortTable.items.push(newItem);

        assortTable.barter_scheme[itemTpl] = barterSchemes;

        if (loyaltyLevel) 
        {
            assortTable.loyal_level_items[itemTpl] = loyaltyLevel;
        }
    }

    private addSingleItemToAssort(assortTable: ITraderAssort, itemTpl: string, unlimitedCount: boolean, stackCount: number, loyaltyLevel: number, currencyType: Money | string, currencyValue: number): void 
    {
        this.addSingleItemToAssortWithBarterScheme(assortTable, itemTpl, unlimitedCount, stackCount, loyaltyLevel, [
            [
                {
                    count: currencyValue,
                    _tpl: currencyType
                }
            ]
        ]);
    }

    private addCollectionToAssort(assortTable: ITraderAssort, items: Item[], unlimitedCount: boolean, stackCount: number, loyaltyLevel: number, currencyType: Money | string, currencyValue: number): void 
    {
        const collectionToAdd: Item[] = JSON.parse(JSON.stringify(items));

        collectionToAdd[0].upd = {
            UnlimitedCount: unlimitedCount,
            StackObjectsCount: stackCount
        };
        collectionToAdd[0].parentId = "hideout";
        collectionToAdd[0].slotId = "hideout";

        assortTable.items.push(...collectionToAdd);

        assortTable.barter_scheme[collectionToAdd[0]._id] = [
            [
                {
                    count: currencyValue,
                    _tpl: currencyType
                }
            ]
        ];

        assortTable.loyal_level_items[collectionToAdd[0]._id] = loyaltyLevel;
    }

    private createAssortTable(container: DependencyContainer, sessionId?: string): ITraderAssort 
    {
        const assortTable: ITraderAssort = {
            nextResupply: 0,
            items: [],
            barter_scheme: {},
            loyal_level_items: {},
            ...this.getPresets(container, sessionId)
        };

        const MILK_ID = "575146b724597720a27126d5";
        //const ALPHA_ID = "544a11ac4bdc2d470e8b456a";
        //const BETA_ID = "5857a8b324597729ab0a0e7d";
        //const EPSILON_ID = "59db794186f77448bc595262";
        //const GAMMA_ID = "5857a8bc2459772bad15db29";
        //const KAPPA_ID = "5c093ca986f7740a1867ab12";
        const SICCP_ID = "5d235bb686f77443f4331278";
        const THWEAPON_ID = "5b6d9ce188a4501afc1b2b25";
        const THITEMCASE_ID = "5c0a840b86f7742ffa4f2482";
        const CASEITEM_ID = "59fb042886f7746c5005a7b2";
        const WEAPONCASE_ID = "59fb023c86f7746d0d4b423c";
        const MEDCASE_ID = "5aafbcd986f7745e590fff23";
        const MONEYCASE_ID = "59fb016586f7746d0d4b423a";
        const FOODCASE_ID = "5c093db286f7740a1b2617e3";
        const MAGBOX_ID = "5c127c4486f7745625356c13";
        const AMMOCASE_ID = "5aafbde786f774389d0cbc0f";
        const PACA_ID = "62a09d79de7ac81993580530";
        const patron_57x28_sb193_ID = "5cc80f67e4a949035e43bbba";
        const mag_57_fn_five_seven_std_57x28_20_ID = "5d3eb5eca4b9363b1f22f8e4";
        const mag_p90_fn_p90_std_57x28_50_ID = "5cc70093e4a949033c734312";
        const helmet_armasight_nvg_googles_mask_ID = "5c066ef40db834001966a595";
        const esmarch_id = "5e831507ea0a7c419c2f9bd9";
        const advil_id = "5af0548586f7743a532b7e99";
        const band_aid_id = "544fb25a4bdc2dfb738b4567";
        const splint_id = "544fb3364bdc2d34748b456a";
        const cms_id = "5d02778e86f774203e7dedbe";
        const car_first_aid_id = "590c661e86f7741e566b646a";
        const morphine_id = "544fb3f34bdc2d03748b456a";
        const btg_id = "5ed515c8d380ab312177c0fa";
        const ahf1m_id = "5ed515f6915ec335206e4152";
        const mule_id = "5ed51652f6c34d2cc26336a1";
        const p22_id = "5ed515ece452db0eb56fc028";
        const sj1_id = "5c0e531286f7747fa54205c2";
        const sj6_id = "5c0e531d86f7747fa23f4d42";
        const sj9_id = "5fca13ca637ee0341a484f46";
        const propital_id = "5c0e530286f7747fa1419862";
        const adrenaline_id = "5c10c8fd86f7743d7d706df3";
        const IFAK_id = "590c678286f77426c9660122";
        const CAT_ID = "60098af40accd37ef2175f27";
        const CALOK_ID = "5e8488fa988a8701445df1e4";
        const SURV12_id = "5d02797c86f774203f38e30a";
        const alumsplint_id = "5af0454c86f7746bf20992e8";
        const vaseline_id = "5755383e24597772cb798966";
        const goldstar_id = "5751a89d24597722aa0e8db0";
        const l1_id = "5ed515e03a40a50460332579";
        const etg_id = "5c0e534186f7747fa1419867";
        const zagustin_id = "5c0e533786f7747fa23f4d47";
        const meldonin_id = "5ed5160a87bb8443d10680b5";
        const obdolbos_id = "5ed5166ad380ab312177c100";
        const xtg12_id = "5fca138c2a7b221b2852a5c6";

        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinsIfak", true, 999999999, 1, [ConfigJson.items.GoblinsIfak.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinsMedCase", true, 999999999, 2, [ConfigJson.items.AbuelasPillBox.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinsBoltHole", true, 999999999, 1, [ConfigJson.items.TiosChest.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinsBackpack", true, 999999999, 1, [ConfigJson.items.TreasureBag.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "lightningstim", true, 999999999, 2, [ConfigJson.items.AbuelosLightingJuice.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "ElDiablosBlood", true, 999999999, 3, [ConfigJson.items.ElDiablosBlood.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinKingsTrophy001", true, 999999999, 3, [ConfigJson.items.RivalsGuise.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinKingsTrophy002", true, 999999999, 3, [ConfigJson.items.A18MonkeySkin.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "DESOXYN", true, 999999999, 1, [ConfigJson.items.DESOXYN.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "556Sludge", true, 999999999, 1, [ConfigJson.items.SludgeAmmo.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "556SludgeBox", true, 999999999, 1, [ConfigJson.items.SludgeAmmoBox.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "CursedMask", true, 999999999, 4, [ConfigJson.items.CursedMask.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinsKACSR25", true, 999999999, 4, [ConfigJson.items.GoblinsKACSR25.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "c00lsh4d35", true, 999999999, 4, [ConfigJson.items.ReallyCoolShades.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "CastleTux", true, 999999999, 4, [ConfigJson.items.CastleTux.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "LegoHead", true, 999999999, 4, [ConfigJson.items.LegoHead.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GC_Cerberus", true, 999999999, 4, [ConfigJson.items.GoblinCase.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GC_Beta1", true, 999999999, 4, [ConfigJson.items.GoblinGasMask.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "MickysTac", true, 999999999, 4, [ConfigJson.items.Lunchbox.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "BSGTheft", true, 999999999, 4, [ConfigJson.items.OMICRON.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "Prisonwallet", true, 999999999, 4, [ConfigJson.items.DooDooBox.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "Coyote", true, 999999999, 4, [ConfigJson.items.CoyoteBox.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "GoblinSec", true, 999999999, 4, [ConfigJson.items.GoblinBox.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);
        this.addSingleItemToAssortWithBarterScheme(assortTable, "DHS", true, 999999999, 4, [ConfigJson.items.DHSLocker.map((value) => ({ _tpl: value.BarterItem, count: value.BarterPrice }))]);



        type SingleItemBarterScheme = { itemTpl: string; unlimitedCount: boolean; stackCount: number; loyaltyLevel: 1 | 2 | 3 | 4; currencyType: Money | string; currencyValue: number };
        const singleItemBarterSchemes: SingleItemBarterScheme[] = [
            { itemTpl: xtg12_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 20000 },
            { itemTpl: obdolbos_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 50000 },
            { itemTpl: meldonin_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 75000 },
            { itemTpl: zagustin_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 150000 },
            { itemTpl: etg_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 100000 },
            { itemTpl: l1_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 100000 },
            { itemTpl: SURV12_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 50000 },
            { itemTpl: CALOK_ID, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 17500 },
            { itemTpl: goldstar_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 17500 },
            { itemTpl: vaseline_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 11000 },
            { itemTpl: alumsplint_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 11000 },
            { itemTpl: CAT_ID, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 15000 },
            { itemTpl: IFAK_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 15000 },
            { itemTpl: sj9_id, unlimitedCount: false, stackCount: 5, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 125000 },
            { itemTpl: sj6_id, unlimitedCount: false, stackCount: 5, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 125000 },
            { itemTpl: sj1_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 125000 },
            { itemTpl: adrenaline_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 70000 },
            { itemTpl: propital_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 4, currencyType: Money.ROUBLES, currencyValue: 125000 },
            { itemTpl: p22_id, unlimitedCount: false, stackCount: 5, loyaltyLevel: 4, currencyType: Money.ROUBLES, currencyValue: 125000 },
            { itemTpl: mule_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 100000 },
            { itemTpl: ahf1m_id, unlimitedCount: false, stackCount: 10, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 90000 },
            { itemTpl: btg_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 3, currencyType: Money.ROUBLES, currencyValue: 100000 },
            { itemTpl: MILK_ID, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 12500 },
            { itemTpl: morphine_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 2, currencyType: Money.ROUBLES, currencyValue: 75000 },
            { itemTpl: esmarch_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 10000 },
            { itemTpl: advil_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 25000 },
            { itemTpl: band_aid_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 7500 },
            { itemTpl: splint_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 8500 },
            { itemTpl: cms_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 24500 },
            { itemTpl: car_first_aid_id, unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 20000 },
            //{ itemTpl: ALPHA_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 500000 },
            //{ itemTpl: BETA_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 1500000 },
            //{ itemTpl: EPSILON_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.DOLLARS, currencyValue: 40000 },
            //{ itemTpl: GAMMA_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.EUROS, currencyValue: 50000 },
            //{ itemTpl: KAPPA_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.EUROS, currencyValue: 65000 },
            { itemTpl: SICCP_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.EUROS, currencyValue: 6000 },
            { itemTpl: THWEAPON_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.EUROS, currencyValue: 25000 },
            { itemTpl: WEAPONCASE_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 1100000 },
            { itemTpl: THITEMCASE_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.DOLLARS, currencyValue: 40000 },
            { itemTpl: CASEITEM_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 1, currencyType: Money.DOLLARS, currencyValue: 15000 },
            { itemTpl: MEDCASE_ID, unlimitedCount: false, stackCount: 2, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 300000 },
            { itemTpl: MONEYCASE_ID, unlimitedCount: false, stackCount: 2, loyaltyLevel: 1, currencyType: Money.DOLLARS, currencyValue: 2700 },
            { itemTpl: FOODCASE_ID, unlimitedCount: false, stackCount: 2, loyaltyLevel: 1, currencyType: Money.ROUBLES, currencyValue: 320000 },
            { itemTpl: MAGBOX_ID, unlimitedCount: false, stackCount: 3, loyaltyLevel: 1, currencyType: Money.EUROS, currencyValue: 2000 },
            { itemTpl: AMMOCASE_ID, unlimitedCount: false, stackCount: 4, loyaltyLevel: 1, currencyType: Money.DOLLARS, currencyValue: 1500 },
            { itemTpl: PACA_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 2, currencyType: Money.DOLLARS, currencyValue: 1000 },
            { itemTpl: patron_57x28_sb193_ID, unlimitedCount: true, stackCount: 1, loyaltyLevel: 2, currencyType: Money.DOLLARS, currencyValue: 25 },
            { itemTpl: mag_57_fn_five_seven_std_57x28_20_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 2, currencyType: Money.DOLLARS, currencyValue: 400 },
            { itemTpl: mag_p90_fn_p90_std_57x28_50_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 2, currencyType: Money.DOLLARS, currencyValue: 500 },
            { itemTpl: helmet_armasight_nvg_googles_mask_ID, unlimitedCount: false, stackCount: 1, loyaltyLevel: 2, currencyType: Money.DOLLARS, currencyValue: 300 },
            { itemTpl: "5c94bbff86f7747ee735c08f", unlimitedCount: true, stackCount: 999999999, loyaltyLevel: 3, currencyType: Money.DOLLARS, currencyValue: 100 },

        ];
        singleItemBarterSchemes.forEach((singleItemBarterScheme: SingleItemBarterScheme) =>
            this.addSingleItemToAssort(
                assortTable,
                singleItemBarterScheme.itemTpl,
                singleItemBarterScheme.unlimitedCount,
                singleItemBarterScheme.stackCount,
                singleItemBarterScheme.loyaltyLevel,
                singleItemBarterScheme.currencyType,
                singleItemBarterScheme.currencyValue
            )
        );

        return assortTable;
    }

    private getPresets(container: DependencyContainer, sessionId?: string): ITraderAssort 
    {
        const assortTable: ITraderAssort = {
            nextResupply: 0,
            items: [],
            barter_scheme: {},
            loyal_level_items: {}
        };

        if (!sessionId) 
        {
            return assortTable;
        }

        const ragfairPriceService: RagfairPriceService = container.resolve<RagfairPriceService>("RagfairPriceService");
        const profileHelper: ProfileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        const akiProfile: IAkiProfile = profileHelper.getFullProfile(sessionId);

        const pool = [];
        for (const weaponBuilds in akiProfile.weaponbuilds) 
        {
            const weaponBuild: WeaponBuild = akiProfile.weaponbuilds[weaponBuilds];
            const preItems: Item[] = weaponBuild.items;

            if (pool.includes(preItems[0]._id)) 
            {
                continue;
            }
            pool.push(preItems[0]._id);

            const currency: Money | string = ConfigJson.settings.PresetCurrency || Money.DOLLARS;
            const price = ragfairPriceService.getDynamicOfferPrice(preItems, currency) * 0.38;
            this.addCollectionToAssort(assortTable, preItems, true, 2000, 1, currency, price);
        }

        return assortTable;
    }

    private loadMyDB(container: DependencyContainer) 
    {
        const databaseImporter: ImporterUtil = container.resolve<ImporterUtil>("ImporterUtil");
        const preAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");

        this.mydb = databaseImporter.loadRecursive(`${preAkiModLoader.getModPath(this.modName)}db/`);
    }

    private add556SludgeToGuns(container: DependencyContainer): void 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        const weapons: string[] = [
            "5ac66cb05acfc40198510a10", // ak101
            "5ac66d015acfc400180ae6e4", // ak102
            "62e7c4fba689e8c9c50dfc38", // augA1
            "63171672192e68c5460cebc5", // augA3
            "5c488a752e221602b412af63", // dtmdr
            "5bb2475ed4351e00853264e3", // hk416A5
            "623063e994fc3f7b302a9696", // hkg36
            "5447a9cd4bdc2dbd208b4567", // m4a1
            "6184055050224f204c1da540", // scarl
            "618428466ef05c2ce828f218", // scarlfde
            "5d43021ca4b9362eab4b5e25", // tx15
            "5c07c60e0db834002330051f" // adar215
        ];
        for (const weapon of weapons) 
        {
            databaseTables.templates.items[weapon]._props.Chambers[0]._props.filters[0].Filter.push("556Sludge");
        }

        const magazines: string[] = [
            "5ac66c5d5acfc4001718d314", // ak101mag
            "630e295c984633f1fb0e7c30", // steyraug42
            "62e7c98b550c8218d602cbb4", // steyraug30
            "630e1adbbd357927e4007c09", // steyraug10
            "5d1340bdd7ad1a0e8d245aab", // stanag40fde
            "544a378f4bdc2d30388b4567", // stanag40
            "544a37c44bdc2d25388b4567", // stanag60
            "5c6592372e221600133e47d7", // stanag100
            "5c0548ae0db834001966a3c2", // slr10630
            "55d4887d4bdc2d962f8b4570", // stanag30
            "5c6d450c2e221600114c997d", // hkpm2
            "5c6d42cb2e2216000e69d7d1", // hkpoly30
            "5c05413a0db834001c390617", // hksteel30
            "62307b7b10d2321fa8741921", // hkg36mag
            "59c1383d86f774290a37e0ca", // magpuld60
            "5aaa5e60e5b5b000140293d6", // magpul10
            "5448c1d04bdc2dff2f8b4569", // magpul20
            "5aaa5dfee5b5b000140293d3", // magpul30
            "6241c2c2117ad530666a5108", // magpul30fde
            "55802d5f4bdc2dac148b458e", // magpulw30
            "5d1340cad7ad1a0b0b249869", // magpulw30fd
            "5c6d46132e221601da357d56", // troy
            "61840bedd92c473c77021635", // scarL
            "61840d85568c120fdd2962a5" // scarLfde
        ];
        for (const magazine of magazines) 
        {
            databaseTables.templates.items[magazine]._props.Cartridges[0]._props.filters[0].Filter.push("556Sludge");
        }
    }

    private addQuestZones(container: DependencyContainer): void 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        databaseTables.globals["QuestZones"].push(
            //Visit
            {
                zoneId: "dormSupply",
                zoneName: "dormSupply",
                zoneType: "Visit",
                zoneLocation: "bigmap",
                position: {
                    x: "174.2927",
                    y: "2.8297",
                    z: "173.2282"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2.3",
                    y: "0.9",
                    z: "2.7"
                }
            },
            {
                zoneId: "gk_16cosmo",
                zoneName: "gk_16cosmo",
                zoneType: "Visit",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "-31.8072",
                    y: "3.0776",
                    z: "400.0927"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "10",
                    y: "7",
                    z: "10"
                }
            },
            {
                zoneId: "gk_20LightH",
                zoneName: "gk_20LightH",
                zoneType: "Visit",
                zoneLocation: "lighthouse",
                position: {
                    x: "187.6786",
                    y: "3.2728",
                    z: "519.4539"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "5",
                    y: "5",
                    z: "5"
                }
            },
            //PlaceItem
            {
                zoneId: "dormBed_204",
                zoneName: "dormBed_204",
                zoneType: "PlaceItem",
                zoneLocation: "bigmap",
                position: {
                    x: "169.92757",
                    y: "3.4624",
                    z: "149.9001"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2.3",
                    y: "0.9",
                    z: "2.7"
                }
            },
            {
                zoneId: "gk_16bilbo",
                zoneName: "gk_16bilbo",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "-77.6543",
                    y: "3.9019",
                    z: "337.9955"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1.2",
                    y: "0.7",
                    z: "0.7"
                }
            },
            {
                zoneId: "gk_17Cosmo",
                zoneName: "gk_17Cosmo",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "-31.6836",
                    y: "3.2593",
                    z: "400.3341"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2",
                    y: "2",
                    z: "2"
                }
            },
            {
                zoneId: "gk_17Cinema",
                zoneName: "gk_17Cinema",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "-138.5329",
                    y: "9.5314",
                    z: "407.3796"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2.1",
                    y: "1",
                    z: "2.1"
                }
            },
            {
                zoneId: "gk_17KilmovCor",
                zoneName: "gk_17KilmovCor",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "-7.8612",
                    y: "1.4393",
                    z: "24.7531"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "8",
                    y: "3",
                    z: "2"
                }
            },
            {
                zoneId: "gk_17KilmovExt",
                zoneName: "gk_17KilmovExt",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "-173.1376",
                    y: "1.6957",
                    z: "63.6272"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2.5",
                    y: "2.5",
                    z: "2.5"
                }
            },
            {
                zoneId: "gk_17KornerSteak",
                zoneName: "gk_17KornerSteak",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "44.7238",
                    y: "5.926",
                    z: "397.7138"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2",
                    y: "1.5",
                    z: "1.5"
                }
            },
            {
                zoneId: "gk_17Pharmacy",
                zoneName: "gk_17Pharmacy",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "26.7192",
                    y: "3.561",
                    z: "172.1752"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }
            },
            {
                zoneId: "gk_17BEARCAMP",
                zoneName: "gk_17BEARCAMP",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "91.8885",
                    y: "6.3798",
                    z: "341.4001"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "2",
                    y: "2",
                    z: "2"
                }
            },
            {
                zoneId: "gk_17Construc",
                zoneName: "gk_17Construc",
                zoneType: "PlaceItem",
                zoneLocation: "TarkovStreets",
                position: {
                    x: "181.3127",
                    y: "6.7438",
                    z: "258.8127"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "3",
                    y: "2",
                    z: "2"
                }
            },
            {
                zoneId: "gk_22LabBamaPoint1",
                zoneName: "gk_22LabBamaPoint1",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-153.1905",
                    y: "0.7364",
                    z: "-397.6273"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            },
            {
                zoneId: "gk_22LabBamaPoint2",
                zoneName: "gk_22LabBamaPoint2",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-183.0704",
                    y: "0.4462",
                    z: "-327.576"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            },
            {
                zoneId: "gk_22LabBamaPoint3",
                zoneName: "gk_22LabBamaPoint3",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-218.5609",
                    y: "4.5405",
                    z: "-379.9588"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            },
            {
                zoneId: "gk_22LabBamaPoint4",
                zoneName: "gk_22LabBamaPoint4",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-244.4642",
                    y: "4.6414",
                    z: "-380.44"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            },
            {
                zoneId: "gk_22LabBamaPoint5",
                zoneName: "gk_22LabBamaPoint5",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-259.6093",
                    y: "4.7356",
                    z: "-321.4201"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            },
            {
                zoneId: "gk_22LabBamaPoint6",
                zoneName: "gk_22LabBamaPoint6",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-261.4091",
                    y: "4.5613",
                    z: "-363.8706"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            },
            {
                zoneId: "gk_22LabBamaPoint7",
                zoneName: "gk_22LabBamaPoint7",
                zoneType: "PlaceItem",
                zoneLocation: "laboratory",
                position: {
                    x: "-169.8311",
                    y: "4.8052",
                    z: "-283.8441"
                },
                rotation: {
                    x: "0",
                    y: "0",
                    z: "0"
                },
                scale: {
                    x: "1",
                    y: "1",
                    z: "1"
                }   
            }
        );
    }

    private addTraderToDb(container: DependencyContainer): void 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        databaseTables.traders[GoblinKingJson._id] = {
            assort: this.createAssortTable(container),
            base: JSON.parse(JSON.stringify({ ...GoblinKingJson, unlockedByDefault: !ConfigJson.settings.UnlockGoblinAfterCollector })) as ITraderBase,
            questassort: JSON.parse(JSON.stringify(QuestAssortJson))
        };

        if (ConfigJson.settings.UnlockGoblinAfterCollector) 
        {
            this.lockTraderBehindCollector(container);
        }
    }

    private lockTraderBehindCollector(container: DependencyContainer) 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        const questCollector: QuestController = databaseTables.templates.quests["5c51aac186f77432ea65c552"];
        questCollector.rewards.Success.push({
            _id: "",
            _tpl: "",
            id: `${GoblinKingJson._id}_UNLOCK`,
            type: QuestRewardType.TRADER_UNLOCK,
            index: 2,
            target: GoblinKingJson._id
        });

        // Quest Loader loads the quest asynchronously, so we have to wait :( thats a "bug", i hope it gets fixed
        //setTimeout(() => 
        //{
        //    Object.entries(QuestValuesCollectorJson)
        //        .filter(([questName]) => questName.startsWith("GK_"))
        //        .forEach(([questName, { level, experience }]) => 
        //        {
        //            databaseTables.templates.quests[questName].conditions.find((v)  v._parent == "Level")._props.value = level;
         //           databaseTables.templates.quests[questName].rewards.Success.find((v) => v.type == "Experience").value = experience;
         //       });
        //} 3000;

        this.logger.log(`[${this.modName}] Goblin will be unlocked after 'Collector'`, LogTextColor.BLUE);
    }

    private addTraderToLocales(container: DependencyContainer, fullName: string, firstName: string, nickName: string, location: string, description: string): void 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();
        const locales: Record<string, Record<string, string>> = databaseTables.locales.global;

        for (const locale in locales) 
        {
            locales[locale][`${GoblinKingJson._id} FullName`] = fullName;
            locales[locale][`${GoblinKingJson._id} FirstName`] = firstName;
            locales[locale][`${GoblinKingJson._id} Nickname`] = nickName;
            locales[locale][`${GoblinKingJson._id} Location`] = location;
            locales[locale][`${GoblinKingJson._id} Description`] = description;
        }
    }

    private addTraderToFleaMarket(container: DependencyContainer) 
    {
        const configServer: ConfigServer = container.resolve<ConfigServer>("ConfigServer");
        const ragfairConfig: IRagfairConfig = configServer.getConfig(ConfigTypes.RAGFAIR);
        ragfairConfig.traders[GoblinKingJson._id] = true;
    }

    private addItemsToDb(container: DependencyContainer) 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        if (ConfigJson.settings.RebalanceItemsForMoreRealism) this.rebalanceItemsForMoreRealism();

        for (const item in this.mydb.templates.items.items.templates) 
        {
            databaseTables.templates.items[item] = this.mydb.templates.items.items.templates[item];
        }
    }

    private rebalanceItemsForMoreRealism() 
    {
        this.mydb.templates.items.items.templates["CursedMask"]._props.CanRequireOnRagfair = false;
        this.mydb.templates.items.items.templates["CursedMask"]._props.CanSellOnRagfair = false;

        this.mydb.templates.items.items.templates["GoblinsIfak"]._props.effects_health.Energy.value = 25;
        this.mydb.templates.items.items.templates["GoblinsIfak"]._props.hpResourceRate = 0;
        this.mydb.templates.items.items.templates["GoblinsIfak"]._props.MaxHpResource = 15;
        this.mydb.templates.items.items.templates["GoblinsIfak"]._props.Rarity = "SuperRare";

        this.logger.log(`[${this.modName}] Items rebalanced for more realism`, LogTextColor.BLUE);
    }

    private addItemsToLocales(container: DependencyContainer): void 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();
        const locales: Record<string, Record<string, string>> = databaseTables.locales.global;

        locales.en = {
            ...locales.en,
            ...this.mydb.locales.en
        };
        locales.ge = {
            ...locales.ge,
            ...this.mydb.locales.ge
        };
        locales.ru = {
            ...locales.ru,
            ...this.mydb.locales.ru
        };
    }

    private addHandbookToDb(container: DependencyContainer) 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        for (const handbook of this.mydb.templates.handbook.Items) 
        {
            if (!databaseTables.templates.handbook.Items.find((i) => i.Id == handbook.Id)) databaseTables.templates.handbook.Items.push(handbook);
        }
    }

    private addBuffsToDb(container: DependencyContainer) 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const databaseTables: IDatabaseTables = databaseServer.getTables();

        const buffs = databaseTables.globals.config.Health.Effects.Stimulator.Buffs;
        const myBuffs = this.mydb.globals.config.Health.Effects.Stimulator.Buffs;
        for (const buff in myBuffs) 
        {
            buffs[buff] = myBuffs[buff];
        }
    }
}
module.exports = { mod: new GoblinKing() };
