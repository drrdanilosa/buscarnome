/**
 * Platform Service - Manages the list of platforms for searching.
 * Incorporates expanded platform list and categories.
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';

const logger = new Logger({ level: 'info' });

// TODO: Consider moving this large array to a separate JSON file for easier management.
const PLATFORM_DEFINITIONS = [
  // --- High Priority / Common ---
  // Social
  { name: 'Instagram', url: 'https://instagram.com/{username}', category: 'social', priority: 'high', checkType: 'http' },
  { name: 'Facebook', url: 'https://facebook.com/{username}', category: 'social', priority: 'high', checkType: 'http' }, // Often requires login / complex check
  { name: 'Twitter', url: 'https://twitter.com/{username}', category: 'social', priority: 'high', checkType: 'http' },
  { name: 'X.com', url: 'https://x.com/{username}', category: 'social', priority: 'high', checkType: 'http' },
  { name: 'TikTok', url: 'https://tiktok.com/@{username}', category: 'social', priority: 'high', checkType: 'http' },
  { name: 'YouTube', url: 'https://youtube.com/@{username}', category: 'social', priority: 'high', checkType: 'http' },
  { name: 'Reddit', url: 'https://reddit.com/user/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/{username}', category: 'professional', priority: 'medium', checkType: 'http' }, // Often requires login
  { name: 'Pinterest', url: 'https://pinterest.com/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'Telegram', url: 'https://t.me/{username}', category: 'social', priority: 'medium', checkType: 'content', foundPatterns: ['View in Telegram', 'Preview channel'], notFoundPatterns: ['username is invalid', 'cannot be displayed'] }, // Check page content
  { name: 'Discord', url: 'https://discord.com/users/{username}', category: 'social', priority: 'medium', checkType: 'http' }, // Requires ID, not username usually
  { name: 'Snapchat', url: 'https://snapchat.com/add/{username}', category: 'social', priority: 'medium', checkType: 'http' }, // Upgraded priority
  { name: 'Bigo.tv', url: 'https://bigo.tv/{username}', category: 'social', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CuriousCat', url: 'https://curiouscat.live/{username}', category: 'social', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Tumblr', url: 'https://{username}.tumblr.com', category: 'social', priority: 'low', checkType: 'http' },
  { name: 'VK', url: 'https://vk.com/{username}', category: 'social', priority: 'low', checkType: 'http', regional: 'RU/CIS' },
  { name: 'Ask.fm', url: 'https://ask.fm/{username}', category: 'social', priority: 'low', checkType: 'http' },
  { name: 'WeHeartIt', url: 'https://weheartit.com/{username}', category: 'social', priority: 'low', checkType: 'http' },
  { name: 'Yubo', url: 'https://yubo.live/{username}', category: 'social', priority: 'low', checkType: 'http' },

  // Adult Content Platforms
  { name: 'OnlyFans', url: 'https://onlyfans.com/{username}', category: 'adult', priority: 'critical', checkType: 'content', adult: true, urgent: true, foundPatterns: ['profile', 'subscribe', 'posts'], notFoundPatterns: ['Page Not Found', 'User not found'] },
  { name: 'Fansly', url: 'https://fansly.com/{username}', category: 'adult', priority: 'critical', checkType: 'content', adult: true, urgent: true, foundPatterns: ['profile', 'follow', 'media'], notFoundPatterns: ['User Not Found', '404'] },
  { name: 'Privacy.com.br', url: 'https://privacy.com.br/{username}', category: 'adult', priority: 'critical', checkType: 'content', adult: true, urgent: true, regional: 'BR', foundPatterns: ['perfil', 'assinar', 'conteúdo'], notFoundPatterns: ['Página não encontrada', 'Usuário não encontrado'] },
  { name: 'JustForFans', url: 'https://justfor.fans/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'FanCentro', url: 'https://fancentro.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'ManyVids', url: 'https://manyvids.com/Profile/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'LoyalFans', url: 'https://loyalfans.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'Fanvue', url: 'https://www.fanvue.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'Fanhouse', url: 'https://fanhouse.app/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Unfiltrd', url: 'https://unfiltrd.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'AVNStars', url: 'https://avnstars.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'MYM.fans', url: 'https://mym.fans/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'IsMyGirl', url: 'https://ismygirl.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'IWantClips', url: 'https://iwantclips.com/store/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'PocketStars', url: 'https://pocketstars.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Clipp.store', url: 'https://clipp.store/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'FanFever', url: 'https://fanfever.com.br/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'Eplay', url: 'https://eplay.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'NSFWFans', url: 'https://nsfwfans.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'PornPayPerView', url: 'https://pornpayperview.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'ModelHub', url: 'https://modelhub.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Unlok.me', url: 'https://unlok.me/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'AdmireMe.vip', url: 'https://admireme.vip/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Cherry.tv', url: 'https://cherry.tv/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Clips4Sale', url: 'https://clips4sale.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'EroticMonkey', url: 'https://eroticmonkey.ch/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'FansMine', url: 'https://fansmine.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'FYP.fans', url: 'https://fyp.fans/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'MyGirlFund', url: 'https://mygirlfund.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'OnlyDudes', url: 'https://onlydudes.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'PeachUltra', url: 'https://peachultra.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Playboy', url: 'https://playboy.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'SextFan', url: 'https://sextfan.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'SinStar', url: 'https://sinstar.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Swame', url: 'https://swame.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Tryst.link', url: 'https://tryst.link/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'XXXLuvv', url: 'https://xxxluvv.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'NaughtyAmerica', url: 'https://naughtyamerica.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'SxyPrn', url: 'https://sxyprn.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'XXXStreams', url: 'https://xxxstreams.org/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },

  // Cam Sites
  { name: 'Chaturbate', url: 'https://chaturbate.com/{username}', category: 'cam', priority: 'critical', checkType: 'content', adult: true, urgent: true, foundPatterns: ['profile', 'Follow', 'is offline'], notFoundPatterns: ['Page not found'] },
  { name: 'Stripchat', url: 'https://stripchat.com/{username}', category: 'cam', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LiveJasmin', url: 'https://livejasmin.com/en/model/{username}', category: 'cam', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'MyFreeCams', url: 'https://profiles.myfreecams.com/{username}', category: 'cam', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'BongaCams', url: 'https://bongacams.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'CamSoda', url: 'https://camsoda.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'CameraPrivê', url: 'https://cameraprive.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'Cam4', url: 'https://cam4.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'CamPlace', url: 'https://camplace.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Cams.com', url: 'https://cams.com/model/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Camversity', url: 'https://camversity.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'CamWhores.tv', url: 'https://camwhores.tv/models/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Flirt4Free', url: 'https://flirt4free.com/model/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'HerbicepsCam', url: 'https://herbicepscam.com/model/{username}', category: 'cam', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'JustCamIt', url: 'https://justcamit.com/cam-model/{username}', category: 'cam', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'OnlyCam', url: 'https://onlycam.com/{username}', category: 'cam', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'SexCamsPlus', url: 'https://sexcamsplus.com/model/{username}', category: 'cam', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'XHamsterLive', url: 'https://xhamsterlive.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'CamModelDirectory', url: 'https://cammodeldirectory.com/model/{username}', category: 'cam', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'XVideosLive', url: 'https://xvideoslive.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true },

  // Agregadores ou Indexadores (High Priority para investigação)
  { name: 'ExposedForYou', url: 'https://exposedforyou.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FanFinders.club', url: 'https://fanfinders.club/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FansDB', url: 'https://fansdb.org/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FansDiscover', url: 'https://fansdiscover.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FansLeak', url: 'https://fansleak.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FansMetrics', url: 'https://fansmetrics.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FinderFans', url: 'https://finderfans.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakedFan', url: 'https://leakedfan.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakedModels.info', url: 'https://leakedmodels.info/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakSpy', url: 'https://leakspy.io/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'OFLeaks.me', url: 'https://ofleaks.me/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'OnlyFinder', url: 'https://onlyfinder.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'PrivateFans', url: 'https://privatefans.net/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'OFLeaksDaily', url: 'https://ofleaksdaily.com/{username}', category: 'agregador', priority: 'critical', checkType: 'content', adult: true, urgent: true },

  // Casting Disfarçado (High Priority para investigação)
  { name: 'AmateurCastingHub', url: 'https://amateurcastinghub.com/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'CastingCouch.xyz', url: 'https://castingcouch.xyz/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FabScout', url: 'https://fabscout.com/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FakeAgency', url: 'https://fakeagency.com/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FakeModels', url: 'https://fakemodels.cc/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'FashionModelDirectory', url: 'https://fashionmodeldirectory.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'FriendsFinder', url: 'https://friendsfinder.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'GirlsDoPorn', url: 'https://girlsdoporn.org/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'ModelCentro', url: 'https://modelcentro.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'ModelHunter', url: 'https://modelhunter.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'NewStarlets', url: 'https://newstarlets.com/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'OpenModelCasting', url: 'https://openmodelcasting.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'RealTeensCasting', url: 'https://realteenscasting.com/{username}', category: 'casting_disfarcado', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'SeekingArrangement', url: 'https://seekingarrangement.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'StarSearchCasting', url: 'https://starsearchcasting.com/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'TalentHunter.tv', url: 'https://talenthunter.tv/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },
  { name: 'WannaModels', url: 'https://wannamodels.cc/{username}', category: 'casting_disfarcado', priority: 'high', checkType: 'content', adult: true },

  // Vazamento de Conteúdo Íntimo (Critical Priority)
  { name: 'CamLeaks', url: 'https://camleaks.cc/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'ExposedWebcamGirls', url: 'https://exposedwebcamgirls.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'ExposedWhores', url: 'https://exposedwhores.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'ImageEarn', url: 'https://imageearn.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'ImageFlea', url: 'https://imageflea.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'IsAnyoneUp', url: 'https://isanyoneup.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakedModels.com', url: 'https://leakedmodels.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakGirls.org', url: 'https://leakgirls.org/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakPeek', url: 'https://leakpeek.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakZone', url: 'https://leakzone.cc/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'MyEx', url: 'https://myex.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'MyExposedNudes', url: 'https://myexposednudes.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'NudoStar', url: 'https://nudostar.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'PinkMeth', url: 'https://pinkmeth.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'SeeMyGF', url: 'https://seemygf.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'SextPanther', url: 'https://sextpanther.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'SnapLeak', url: 'https://snapleak.xyz/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'SnapNudes', url: 'https://snapnudes.net/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'SnapNudez', url: 'https://snapnudez.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'TheFappening.pl', url: 'https://thefappening.pl/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'TheTexxxan', url: 'https://thetexxxan.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'ThotHub.vip', url: 'https://thothub.vip/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'UGotPosted', url: 'https://ugotposted.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'WikiLeakGirls', url: 'https://wikileakgirls.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'WinByState', url: 'https://winbystate.com/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },
  { name: 'XLeaks', url: 'https://xleaks.cc/{username}', category: 'vazamento', priority: 'critical', checkType: 'content', adult: true, urgent: true },

  // Portfolio / Creative
  { name: 'Behance', url: 'https://behance.net/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
  { name: 'ArtStation', url: 'https://{username}.artstation.com', category: 'portfolio', priority: 'medium', checkType: 'http' },
  { name: 'DeviantArt', url: 'https://deviantart.com/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
  { name: 'ModelMayhem', url: 'https://modelmayhem.com/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
  { name: '500px', url: 'https://500px.com/p/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' }, // Upgraded priority
  { name: 'Flickr', url: 'https://flickr.com/people/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' }, // Upgraded priority
  { name: 'Kavyar', url: 'https://kavyar.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Boudoir/Artistic focus
  { name: 'Purpleport', url: 'https://purpleport.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Model/Photographer network
  { name: 'About.me', url: 'https://about.me/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ArtLimited', url: 'https://artlimited.net/user/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Canva', url: 'https://canva.com/@{username}', category: 'portfolio', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'Carbonmade', url: 'https://{username}.carbonmade.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Cargo', url: 'https://{username}.cargo.site', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Clippings.me', url: 'https://clippings.me/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Crevado', url: 'https://{username}.crevado.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Dribbble', url: 'https://dribbble.com/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'Dunked', url: 'https://{username}.dunked.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'FolioHD', url: 'https://foliohd.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Format', url: 'https://{username}.format.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Krop', url: 'https://{username}.krop.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'LightFolio', url: 'https://{username}.lightfolio.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'OneModelPlace', url: 'https://onemodelplace.com/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'Photo.net', url: 'https://photo.net/photos/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'PhotoDeck', url: 'https://{username}.photodeck.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'PhotoShelter', url: 'https://{username}.photoshelter.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Pic-Time', url: 'https://{username}.pic-time.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Pixieset', url: 'https://{username}.pixieset.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Pixpa', url: 'https://{username}.pixpa.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'PortfolioBox', url: 'https://{username}.portfoliobox.net', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'ShootProof', url: 'https://{username}.shootproof.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'SlickPic', url: 'https://{username}.slickpic.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'SmugMug', url: 'https://{username}.smugmug.com', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list
  { name: 'Snapwire', url: 'https://snapwi.re/{username}', category: 'portfolio', priority: 'low', checkType: 'http' }, // Added from new list

  // Link-in-Bio
  { name: 'Linktree', url: 'https://linktr.ee/{username}', category: 'linkinbio', priority: 'medium', checkType: 'http' },
  { name: 'Beacons.ai', url: 'https://beacons.ai/{username}', category: 'linkinbio', priority: 'medium', checkType: 'http' },
  { name: 'AllMyLinks', url: 'https://allmylinks.com/{username}', category: 'linkinbio', priority: 'medium', checkType: 'http' }, // Popular with adult creators
  { name: 'Carrd.co', url: 'https://{username}.carrd.co', category: 'linkinbio', priority: 'medium', checkType: 'http' }, // Upgraded priority
  { name: 'Direct.me', url: 'https://direct.me/{username}', category: 'linkinbio', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'GetMy.Link', url: 'https://getmy.link/{username}', category: 'linkinbio', priority: 'medium', checkType: 'http' }, // Added from new list

  // Image Sharing
  { name: 'Imgur', url: 'https://imgur.com/user/{username}', category: 'images', priority: 'medium', checkType: 'http' },
  { name: 'Pixiv', url: 'https://pixiv.net/en/users/{username}', category: 'images', priority: 'medium', checkType: 'http' }, // Often artistic/anime, can be NSFW
  { name: 'Imagefap', url: 'https://imagefap.com/profile/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Adult image sharing
  { name: 'Erome', url: 'https://erome.com/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Adult albums
  { name: 'Redgifs', url: 'https://redgifs.com/users/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Adult gifs
  { name: '8Muses', url: 'https://8muses.com/users/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Danbooru', url: 'https://danbooru.donmai.us/posts?tags=user%3A{username}', category: 'images', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'E621', url: 'https://e621.net/posts?tags=user%3A{username}', category: 'images', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'FurAffinity', url: 'https://furaffinity.net/user/{username}', category: 'images', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'Gelbooru', url: 'https://gelbooru.com/index.php?page=account&s=profile&uname={username}', category: 'images', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'Hentai-Foundry', url: 'https://hentai-foundry.com/user/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Hypnohub', url: 'https://hypnohub.net/user/show/{username}', category: 'images', priority: 'medium', checkType: 'content', adult: true }, // Added from new list
  { name: 'LeakGirls', url: 'https://leakgirls.com/user/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Motherless', url: 'https://motherless.com/u/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'NHentai', url: 'https://nhentai.net/users/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'PornImg', url: 'https://pornimg.com/user/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'PornPics', url: 'https://pornpics.com/pornstar/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'R18', url: 'https://r18.com/videos/vod/movies/actress/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Rule34.paheal', url: 'https://rule34.paheal.net/user/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Rule34.xxx', url: 'https://rule34.xxx/index.php?page=account&s=profile&uname={username}', category: 'images', priority: 'high', checkType: 'content', adult: true }, // Added from new list

  // Forums (General - requires specific crawler/strategy later)
  { name: '4chan', url: 'https://boards.4channel.org/{board}/', category: 'forum', priority: 'high', checkType: 'manual', adult: true }, // Requires specific board and search
  { name: 'Reddit', url: 'https://reddit.com/user/{username}', category: 'forum', priority: 'medium', checkType: 'http' }, // Already listed as social, but also forum
  { name: 'LPSG', url: 'https://lpsg.com/members/{username}', category: 'forum', priority: 'high', checkType: 'http', adult: true },
  { name: 'FreeOnes', url: 'https://freeones.com/forums/members/{username}', category: 'forum', priority: 'high', checkType: 'http', adult: true },
  { name: '8kun', url: 'https://8kun.top/user/{username}', category: 'forum', priority: 'high', checkType: 'manual', adult: true }, // Added from new list
  { name: 'Anon-IB', url: 'https://anon-ib.co/user/{username}', category: 'forum', priority: 'high', checkType: 'manual', adult: true }, // Added from new list
  { name: 'BDSMLR', url: 'https://bdsmlr.com/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'CelebLeaks', url: 'https://celebleaks.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Coomer.party', url: 'https://coomer.party/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'DarkF.app', url: 'https://darkf.app/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Fapello', url: 'https://fapello.com/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Forum.xxx', url: 'https://forum.xxx/members/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Forumophilia', url: 'https://forumophilia.com/profile/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Leak.sx', url: 'https://leak.sx/member.php?username={username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Leaked.zone', url: 'https://leaked.zone/members/?username={username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'MyDirtyHobby', url: 'https://mydirtyhobby.com/profile/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Nonude.club', url: 'https://nonude.club/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'NSFW.xxx', url: 'https://nsfw.xxx/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'PlanetLeak', url: 'https://planetleak.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'PlanetSuzy', url: 'https://planetsuzy.org/member.php?username={username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'R34Porn', url: 'https://r34porn.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'RealityForum', url: 'https://realityforum.net/member.php?username={username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'RedditSide', url: 'https://redditside.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true }, // Added from new list

  // Escort / Regional Adult (BR)
  { name: 'FatalModel', url: 'https://fatalmodel.com/{username}', category: 'escort', priority: 'critical', checkType: 'content', adult: true, urgent: true, regional: 'BR' },
  { name: 'Skokka', url: 'https://skokka.com/br/profile/{username}', category: 'escort', priority: 'critical', checkType: 'content', adult: true, urgent: true, regional: 'BR' }, // URL structure may vary
  { name: 'Mileroticos', url: 'https://mileroticos.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'Photoacompanhantes', url: 'https://photoacompanhantes.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'Sexlog', url: 'https://sexlog.com/{username}', category: 'escort', priority: 'medium', checkType: 'content', adult: true, regional: 'BR' }, // Also a social network
  { name: 'AdultWork', url: 'https://adultwork.com/ViewProfile.asp?UserName={username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Anunciart', url: 'https://anunciart.com/usuario/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'CityOfLove', url: 'https://cityoflove.com/escort/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Companheiros', url: 'https://companheiros.net/perfil/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'EasyCompanions', url: 'https://easycompanions.com/escort/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'EncontreUmGaroto', url: 'https://encontreumgaroto.com/perfil/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'EuroGirlsEscort', url: 'https://eurogirlsescort.com/escort/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Gatas', url: 'https://gatas.com/perfil/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'GPOnline', url: 'https://gponline.net/perfil/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'Hot.com.br', url: 'https://hot.com.br/perfil/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'Locanto', url: 'https://locanto.com/escort/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Lupanares', url: 'https://lupanares.com/perfil/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' }, // Added from new list
  { name: 'Massage-Republic', url: 'https://massage-republic.com/escorts/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list
  { name: 'Meetes', url: 'https://meetes.com/profile/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true }, // Added from new list

  // Gaming
  { name: 'Twitch', url: 'https://twitch.tv/{username}', category: 'gaming', priority: 'medium', checkType: 'http' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{username}', category: 'gaming', priority: 'medium', checkType: 'http' },

  // --- Lower Priority / Niche ---
  { name: 'Tumblr', url: 'https://{username}.tumblr.com', category: 'social', priority: 'low', checkType: 'http' },
  { name: 'VK', url: 'https://vk.com/{username}', category: 'social', priority: 'low', checkType: 'http', regional: 'RU/CIS' },
  { name: 'Ask.fm', url: 'https://ask.fm/{username}', category: 'social', priority: 'low', checkType: 'http' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{username}', category: 'music', priority: 'low', checkType: 'http' },
  { name: 'Bandcamp', url: 'https://{username}.bandcamp.com', category: 'music', priority: 'low', checkType: 'http' },
  { name: 'Etsy', url: 'https://etsy.com/shop/{username}', category: 'shop', priority: 'low', checkType: 'http' },
  { name: 'Fiverr', url: 'https://fiverr.com/{username}', category: 'freelance', priority: 'low', checkType: 'http' },
  { name: 'Medium', url: 'https://medium.com/@{username}', category: 'blog', priority: 'low', checkType: 'http' },
  { name: 'GitHub', url: 'https://github.com/{username}', category: 'development', priority: 'low', checkType: 'http' },

  // --- Dark Web (Requires Tor Connector) ---
  { name: 'Hidden Wiki (User)', url: 'http://zqktlwiuavvvqqt4ybvgvi7tyo4hjl5xgfuvpdf6otjiycgwqbym2qad.onion/wiki/index.php/User:{username}', category: 'darkweb', priority: 'medium', checkType: 'content', requiresTor: true },
  { name: 'Dread (User)', url: 'http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/u/{username}', category: 'darkweb', priority: 'high', checkType: 'content', requiresTor: true },
  { name: 'Breached (User)', url: 'http://breached65xqh64s7xbkvqgg7bmj4nj7656hcb7x4g42x753r7zmejqd.onion/User-{username}', category: 'darkweb', priority: 'high', checkType: 'content', requiresTor: true }, // Check URL validity
  { name: 'TorLinkBunker', url: 'http://jld3zkuo4b5mbios.onion/search/{username}', category: 'darkweb', priority: 'high', checkType: 'content', requiresTor: true }, // Added from new list

  // --- Casting / Modeling (Often requires login or specific search) ---
  { name: 'Backstage', url: 'https://backstage.com/u/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Upgraded priority
  { name: 'StarNow', url: 'https://starnow.com/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Upgraded priority
  { name: 'Models.com', url: 'https://models.com/models/{username}', category: 'casting', priority: 'medium', checkType: 'manual' }, // Upgraded priority, manual check
  { name: 'ActorsAccess', url: 'https://actorsaccess.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'AllCasting', url: 'https://allcasting.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CastingCallHub', url: 'https://castingcallhub.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CastingElite', url: 'https://castingelite.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CastingFrontier', url: 'https://castingfrontier.com/talent/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CastingNetworks', url: 'https://castingnetworks.com/talent/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CastingNow', url: 'https://castingnow.co.uk/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'CastitTalent', url: 'https://castittalent.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'DNA-Models', url: 'https://dna-models.com/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'EliteModelWorld', url: 'https://elitemodelworld.com/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ExploreTalent', url: 'https://exploretalent.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'FordModels', url: 'https://fordmodels.com/models/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'IMGModels', url: 'https://imgmodels.com/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'MavrickArtists', url: 'https://mavrickartists.com/talent/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ModelBookings', url: 'https://modelbookings.com/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ModelManagement', url: 'https://modelmanagement.com/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ModelScouts', url: 'https://modelscouts.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ModelWire', url: 'https://modelwire.com/modelprofile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'ModNet', url: 'https://modnet.io/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'NewFaces', url: 'https://newfaces.com/model/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list
  { name: 'NextManagement', url: 'https://nextmanagement.com/profile/{username}', category: 'casting', priority: 'medium', checkType: 'http' }, // Added from new list

  // --- Archives (Usually requires specific file hash or URL, not just username) ---
  { name: 'Internet Archive (Wayback)', url: 'https://web.archive.org/web/*/{username}*', category: 'archive', priority: 'low', checkType: 'manual' }, // Example URL, needs refinement
  { name: 'Mega.nz (Folder)', url: 'https://mega.nz/folder/{some_hash}', category: 'archive', priority: 'low', checkType: 'manual' }, // Cannot search by username directly

];

// Termos e palavras-chave para busca avançada
const SEARCH_KEYWORDS = [
  // Termos gerais
  "18+", "acervo", "alt account", "backup account", "bio link", "blue check", "booking", "buy my content", "check bio", "close friends", 
  "coleção", "compartilhe", "content creator", "content menu", "conteúdo adulto", "conteúdo desbloqueado", "conteúdo especial", "conteúdo vazado", 
  "creator", "custom content", "dating profile", "dick rate", "discord server", "dm for prices", "dms open", "domingo tem", "ensaios", 
  "exclusive content", "exclusivo", "explicit", "feet pics", "feetfinder", "feetpics", "filter bypass", "fotos privadas", "fotógrafa sensual", 
  "freelance model", "hire me", "hookup", "implied nude", "instagram model", "intimate", "join my vip", "kink friendly", "leak", "leaked", 
  "leaked content", "lewd", "liberal", "lingerie", "link in bio", "linkinbio", "mega folder", "mega link", "model profile", "modelo", 
  "monetize seu conteúdo", "nofacefreak_18", "nsfw", "nudes", "ofans", "official", "pacotes promocionais", "paid content", "patreon", 
  "payperview", "portfolio", "portfolio link", "ppv", "premium content", "premium snapchat", "privacy leak", "private account", "private content", 
  "private snap", "produtor", "rate", "real", "reels", "renda extra", "safadinha", "safadão", "satisfeita", "satisfeito", "second account", 
  "sell nudes", "selo azul", "sem frescura", "semprecinto", "sensual", "sigam", "sigilo absoluto", "sigiloso", "snap", "snapcode", "sph", 
  "sub4sub", "subscription", "sugar baby", "sugar daddy", "superhq", "só para amigos", "talenthouse", "telegram channel", "tesuda", "tip menu", 
  "tribute", "twitch streamer", "unlokme", "verificado", "verified", "videos", "vip access", "vip content", "vídeos personalizados", "webcam", 
  "youtube channel",

  // Termos específicos para conteúdo adulto
  "acompanhante de luxo", "acompanhante executiva", "acompanhantes", "adultwork", "ahegao", "anime girl", "art nude", "atendimento a domicílio", 
  "atendimento com local", "atendimento vip", "ator", "atriz", "bdsmlr", "camboy", "camgirl", "camming", "carioca", "casa das primas", "cock tribute", 
  "com local", "cosplay lewd", "cosplay nsfw", "cumtribute", "dominatrix", "ecchi", "erotic photography", "escort", "faz programa", "femboy", 
  "femdom", "fetish content", "findom", "foot fetish", "furry nsfw", "garota programa", "gaúcha", "gostosa", "gostoso", "gp", "hentai", 
  "hentai foundry", "hentai girl", "massagem com final feliz", "massagem tântrica", "massagens", "massagista", "massoterapia", "mineira", 
  "nordestina", "novinha", "novinho", "paulista", "putaria", "relaxamento profundo", "ritmo intenso", "sacanagem", "submissiva", "terapeuta", 
  "terapêutica", "waifu", "webcamgirl br", "xxx"
];

export class PlatformService {
  constructor(storageService) {
    this.storageService = storageService; // Optional: for storing enabled/disabled status
    this.platforms = this._processPlatforms(PLATFORM_DEFINITIONS);
    this.keywords = SEARCH_KEYWORDS;
    logger.info(`PlatformService initialized with ${this.platforms.length} platforms and ${this.keywords.length} keywords.`);
  }

  /**
   * Process raw platform definitions (e.g., add default properties).
   */
  _processPlatforms(definitions) {
    return definitions.map(p => ({
      icon: this._getIconForCategory(p.category),
      risk: this._getRiskForCategory(p.category, p.adult),
      adult: p.adult || false,
      urgent: p.urgent || false,
      regional: p.regional || null,
      requiresTor: p.requiresTor || false,
      checkType: p.checkType || 'http', // Default check type
      priority: p.priority || 'low', // Default priority
      foundPatterns: p.foundPatterns || [],
      notFoundPatterns: p.notFoundPatterns || [],
      ...p, // Spread the original definition, allowing overrides
    }));
  }

  _getIconForCategory(category) {
    const icons = {
      social: '🌐', professional: '💼', adult: '🔞', cam: '📹',
      portfolio: '🎨', linkinbio: '🔗', images: '🖼️', forum: '💬',
      escort: '👤', gaming: '🎮', music: '🎵', shop: '🛒',
      freelance: '💰', blog: '📝', development: '💻', darkweb: '🧅',
      casting: '🎭', archive: '📦', default: '❓'
    };
    return icons[category] || icons.default;
  }

  _getRiskForCategory(category, isAdult) {
      if (isAdult) return 'high';
      const risks = {
          darkweb: 'high', escort: 'high', forum: 'medium', // Default forum risk
          social: 'low', professional: 'low', portfolio: 'low',
          linkinbio: 'low', images: 'medium', // Default image risk
          gaming: 'low', music: 'low', shop: 'low', freelance: 'low',
          blog: 'low', development: 'low', casting: 'low', archive: 'low',
          default: 'low'
      };
      return risks[category] || risks.default;
  }

  /**
   * Get all available platforms.
   * @returns {Array<object>} List of platform objects.
   */
  getAllPlatforms() {
    // TODO: Add filtering based on user settings (enabled/disabled)
    return [...this.platforms];
  }

  /**
   * Get platforms by category.
   * @param {string} category - The category name.
   * @returns {Array<object>} List of platform objects in that category.
   */
  getPlatformsByCategory(category) {
    return this.platforms.filter(platform => platform.category === category);
  }

  /**
   * Get platforms by priority.
   * @param {string} priorityLevel - 'critical', 'high', 'medium', 'low'.
   * @returns {Array<object>} List of platform objects with that priority.
   */
  getPlatformsByPriority(priorityLevel) {
      return this.platforms.filter(platform => platform.priority === priorityLevel);
  }

  /**
   * Get platforms requiring Tor.
   * @returns {Array<object>} List of platform objects requiring Tor.
   */
  getTorPlatforms() {
      return this.platforms.filter(platform => platform.requiresTor);
  }

  /**
   * Get all search keywords.
   * @returns {Array<string>} List of search keywords.
   */
  getAllKeywords() {
    return [...this.keywords];
  }

  /**
   * Get keywords that match a specific pattern.
   * @param {string} pattern - Pattern to match.
   * @returns {Array<string>} List of matching keywords.
   */
  getKeywordsByPattern(pattern) {
    const regex = new RegExp(pattern, 'i');
    return this.keywords.filter(keyword => regex.test(keyword));
  }

  // TODO: Add methods to enable/disable platforms via storageService
}
