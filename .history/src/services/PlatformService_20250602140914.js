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
  { name: '1x.com', url: 'https://1x.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'ArtMajeur', url: 'https://artmajeur.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'IdolMMG', url: 'https://idolmmg.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'ViewBug', url: 'https://viewbug.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'VisualSociety', url: 'https://visualsociety.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'VSCO', url: 'https://vsco.co/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
  { name: 'Weebly', url: 'https://{username}.weebly.com', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'WordPress.com', url: 'https://{username}.wordpress.com', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'Yola', url: 'https://{username}.yola.com', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'Zenfolio', url: 'https://{username}.zenfolio.com', category: 'portfolio', priority: 'low', checkType: 'http' },

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
  { name: 'SuperHQ', url: 'https://superhq.net/{username}', category: 'images', priority: 'high', checkType: 'content', adult: true },
  { name: 'XBooru', url: 'https://xbooru.com/{username}', category: 'images', priority: 'medium', checkType: 'content', adult: true },

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
  { name: 'Leak.sx', url: 'https://leak.sx/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'Leaked.zone', url: 'https://leaked.zone/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'MyDirtyHobby', url: 'https://mydirtyhobby.com/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'NonNude.club', url: 'https://nonnude.club/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'NSFW.xxx', url: 'https://nsfw.xxx/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'PlanetLeak', url: 'https://planetleak.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'PlanetSuzy', url: 'https://planetsuzy.org/members/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'R34porn', url: 'https://r34porn.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'RealityForum', url: 'https://realityforum.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'RedditSide', url: 'https://redditside.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'TheFappeningBlog', url: 'https://thefappeningblog.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'TorLinkBunker', url: 'https://torlinkbunker.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'ViperGirls.to', url: 'https://vipergirls.to/members/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },

  // Fóruns de Conteúdo Adulto (específicos brasileiros)
  { name: 'AmateurFap', url: 'https://amateurfap.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'Anonib.al', url: 'https://anonib.al/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'CariGold', url: 'https://carigold.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'CumOnPrintedPics', url: 'https://cumonprintedpics.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'DirtyShip', url: 'https://dirtyship.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'EGirlForums', url: 'https://egirlforums.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'EksiSozluk', url: 'https://eksisozluk.com/biri/{username}', category: 'forum', priority: 'medium', checkType: 'content', adult: true, regional: 'TR' },
  { name: 'ForumH', url: 'https://forumh.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'ForumSexInSex', url: 'https://forumsexinsex.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'ForumSmotri', url: 'https://forumsmotri.club/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'HKForum', url: 'https://hkforum.net/user/{username}', category: 'forum', priority: 'medium', checkType: 'content', adult: true, regional: 'HK' },
  { name: 'ImgLeak', url: 'https://imgleak.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'Kaskus', url: 'https://kaskus.co.id/profile/{username}', category: 'forum', priority: 'medium', checkType: 'content', adult: true, regional: 'ID' },
  { name: 'LowYat', url: 'https://lowyat.net/user/{username}', category: 'forum', priority: 'medium', checkType: 'content', adult: true, regional: 'MY' },
  { name: 'NSFWTube.club', url: 'https://nsfwtube.club/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'Sexy-EGirls', url: 'https://sexy-egirls.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'SocialMediaGirls', url: 'https://socialmediagirls.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ThotHub.lol', url: 'https://thothub.lol/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ViperGirls', url: 'https://vipergirls.net/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true },
  { name: 'XOSSip', url: 'https://xossip.com/profile/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true, regional: 'IN' },

  // Vazamento de Conteúdo Íntimo
  { name: 'CamLeaks', url: 'https://camleaks.cc/model/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ExposedWebcamGirls', url: 'https://exposedwebcamgirls.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ExposedWhores', url: 'https://exposedwhores.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ImageEarn', url: 'https://imageearn.com/user/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ImageFlea', url: 'https://imageflea.com/user/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'IsAnyoneUp', url: 'https://isanyoneup.com/user/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakedModels.com', url: 'https://leakedmodels.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakGirls.org', url: 'https://leakgirls.org/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakPeek', url: 'https://leakpeek.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakZone', url: 'https://leakzone.cc/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'MyEx', url: 'https://myex.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'MyExposedNudes', url: 'https://myexposednudes.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'NudoStar', url: 'https://nudostar.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'PinkMeth', url: 'https://pinkmeth.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'SeeMyGF', url: 'https://seemygf.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'SextPanther', url: 'https://sextpanther.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'SnapLeak', url: 'https://snapleak.xyz/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'SnapNudes', url: 'https://snapnudes.net/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'SnapNudez', url: 'https://snapnudez.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'TheFappening.pl', url: 'https://thefappening.pl/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'TheTexxxan', url: 'https://thetexxxan.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'ThotHub.vip', url: 'https://thothub.vip/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'UGotPosted', url: 'https://ugotposted.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'WikiLeakGirls', url: 'https://wikileakgirls.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'WinByState', url: 'https://winbystate.com/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'XLeaks', url: 'https://xleaks.cc/{username}', category: 'vazamento', priority: 'high', checkType: 'content', adult: true, urgent: true },

  // Plataformas de Venda de Conteúdo Íntimo (adicionais)
  { name: 'AdmireMe.vip', url: 'https://admireme.vip/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'CamModelDirectory', url: 'https://cammodeldirectory.info/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Cherry.tv', url: 'https://cherry.tv/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'Clips4Sale', url: 'https://clips4sale.com/studio/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'EroticMonkey', url: 'https://eroticmonkey.ch/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true, regional: 'CH' },
  { name: 'FansMine', url: 'https://fansmine.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'FYP.fans', url: 'https://fyp.fans/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'MyGirlFund', url: 'https://mygirlfund.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'OfLeaksDaily', url: 'https://ofleaksdaily.com/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'OnlyDudes', url: 'https://onlydudes.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'PeachUltra', url: 'https://peachultra.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Playboy.com', url: 'https://playboy.com/profile/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'SextFan', url: 'https://sextfan.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'SinStar', url: 'https://sinstar.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Swame', url: 'https://swame.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },
  { name: 'Tryst.link', url: 'https://tryst.link/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'XXXLuvv', url: 'https://xxxluvv.com/{username}', category: 'adult', priority: 'medium', checkType: 'content', adult: true },

  // Sites de Acompanhantes (adicionais)
  { name: 'BabylonGirls', url: 'https://babylongirls.co.uk/escort/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'UK' },
  { name: 'Backpage', url: 'https://backpage.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'BangkokEscortService', url: 'https://bangkokescortservice.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'TH' },
  { name: 'BarcelonaEscortList', url: 'https://barcelonaescortlist.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'ES' },
  { name: 'CairoEscortDirectory', url: 'https://cairoescortdirectory.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'EG' },
  { name: 'CallGirlInCall', url: 'https://callgirlincall.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'CityOfAngelsGirls', url: 'https://cityofangelsgirls.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'US' },
  { name: 'DelhiEscortService', url: 'https://delhiescortservice.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'IN' },
  { name: 'EgyptianEscortGuide', url: 'https://egyptianescortguide.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'EG' },
  { name: 'EscortAds', url: 'https://escortads.xxx/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'EscortBabylon', url: 'https://escortbabylon.net/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'EscortDirectory', url: 'https://escortdirectory.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'EscortFace', url: 'https://escortface.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'EscortGuide', url: 'https://escortguide.co.uk/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'UK' },
  { name: 'EscortLand', url: 'https://escortland.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'EscortList', url: 'https://escortlist.cc/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'EurosGirlsEscort', url: 'https://eurosgirlsescort.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'EU' },
  { name: 'GirlsFromAsia', url: 'https://girlsfromasia.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'AS' },
  { name: 'IndonesianEscortAgency', url: 'https://indonesianescortagency.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'ID' },
  { name: 'IstanbulEscortService', url: 'https://istanbulescortservice.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'TR' },
  { name: 'JakartaEscortService', url: 'https://jakartaescortservice.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'ID' },
  { name: 'KLEscortDirectory', url: 'https://klescortdirectory.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'MY' },
  { name: 'LuxuryEscortDirectory', url: 'https://luxuryescortdirectory.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'MadridEscortGuide', url: 'https://madridescortguide.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'ES' },
  { name: 'MalaysianEscortGuide', url: 'https://malaysianescortguide.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'MY' },
  { name: 'MexicanEscortDirectory', url: 'https://mexicanescortdirectory.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'MX' },
  { name: 'MexicoCityEscortService', url: 'https://mexicocityescortservice.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'MX' },
  { name: 'MumbaiEscortDirectory', url: 'https://mumbaiescortdirectory.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'IN' },
  { name: 'MyRedbook', url: 'https://myredbook.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'PrivateGirls', url: 'https://privategirls.ch/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'CH' },
  { name: 'SGCompanions', url: 'https://sgcompanions.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'SG' },
  { name: 'SingaporeEscortList', url: 'https://singaporeescortlist.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'SG' },
  { name: 'ThaiEscortBangkok', url: 'https://thaiescortbangkok.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'TH' },
  { name: 'TopEscortBabes', url: 'https://topescortbabes.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'TurkishEscortAgency', url: 'https://turkishescortagency.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'TR' },
  { name: 'XLamma', url: 'https://xlamma.ch/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'CH' },

  // Sites "desconhecida" (diversos)
  { name: 'Discord', url: 'https://discord.com/users/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'Ask.fm', url: 'https://ask.fm/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'CuriousCat', url: 'https://curiouscat.live/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'Artmajeur', url: 'https://artmajeur.com/{username}', category: 'portfolio', priority: 'low', checkType: 'http' },
  { name: 'Archived.moe', url: 'https://archived.moe/user/{username}', category: 'other', priority: 'medium', checkType: 'content' },
  { name: 'Bigo.tv', url: 'https://bigo.tv/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'Kavyar', url: 'https://kavyar.com/{username}', category: 'portfolio', priority: 'medium', checkType: 'http' },
  { name: 'PepperPlay', url: 'https://pepperplay.com/{username}', category: 'social', priority: 'medium', checkType: 'http' },
  { name: 'PornHub', url: 'https://pornhub.com/users/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true },
  { name: 'CameraPrive', url: 'https://cameraprive.com/{username}', category: 'cam', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'FotoLog', url: 'https://fotolog.com.br/{username}', category: 'social', priority: 'low', checkType: 'http', regional: 'BR' },
  { name: 'ForumBR', url: 'https://forumbr.net/user/{username}', category: 'forum', priority: 'medium', checkType: 'content', regional: 'BR' },
  { name: 'Forum UOL', url: 'https://forum.uol.com.br/user/{username}', category: 'forum', priority: 'medium', checkType: 'content', regional: 'BR' },
  { name: 'HardBR', url: 'https://hardbr.com/user/{username}', category: 'forum', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'GP Guia', url: 'https://gpguia.net/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'PainelPressao', url: 'https://panelapressao.org.br/{username}', category: 'other', priority: 'low', checkType: 'content', regional: 'BR' },
  { name: 'Webz.io', url: 'https://webz.io/{username}', category: 'other', priority: 'low', checkType: 'http' },
  { name: 'MYM.fans', url: 'https://mym.fans/{username}', category: 'adult', priority: 'high', checkType: 'content', adult: true, regional: 'FR' },

  // Sites adicionais de Escort brasileiros
  { name: 'Skokka', url: 'https://skokka.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'Vivastreet', url: 'https://vivastreet.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'Mileroticos', url: 'https://mileroticos.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true, regional: 'BR' },
  { name: 'Paktor', url: 'https://paktor.com/{username}', category: 'escort', priority: 'medium', checkType: 'content', adult: true, regional: 'AS' },
  { name: 'Sugarbook', url: 'https://sugarbook.com/{username}', category: 'escort', priority: 'high', checkType: 'content', adult: true },
  { name: 'Terapeuta.net', url: 'https://terapeuta.net/{username}', category: 'escort', priority: 'medium', checkType: 'content', adult: true, regional: 'BR' },

  // Agregadores restantes
  { name: 'FansDiscover', url: 'https://fansdiscover.com/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true },
  { name: 'FansLeak', url: 'https://fansleak.com/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'FansMetrics', url: 'https://fansmetrics.com/{username}', category: 'agregador', priority: 'medium', checkType: 'content', adult: true },
  { name: 'FinderFans', url: 'https://finderfans.com/{username}', category: 'agregador', priority: 'medium', checkType: 'content', adult: true },
  { name: 'LeakedFan', url: 'https://leakedfan.com/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakedModels.info', url: 'https://leakedmodels.info/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'LeakSpy', url: 'https://leakspy.io/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'OfLeaks.me', url: 'https://ofleaks.me/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true, urgent: true },
  { name: 'OnlyFinder', url: 'https://onlyfinder.com/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true },
  { name: 'PrivateFans', url: 'https://privatefans.net/{username}', category: 'agregador', priority: 'high', checkType: 'content', adult: true },

  // Sites referência
  { name: 'CreatorBlog.direct', url: 'https://creatorblog.direct.me/{username}', category: 'blog', priority: 'low', checkType: 'http' },
  { name: 'CreatorTraffic', url: 'https://creatortraffic.com/{username}', category: 'blog', priority: 'low', checkType: 'http' },
  { name: 'TheHack', url: 'https://thehack.com.br/{username}', category: 'blog', priority: 'low', checkType: 'http', regional: 'BR' },

];

// Termos e palavras-chave para busca avançada (extraídos do JSON OSINT completo)
const SEARCH_KEYWORDS = [
  // Termos básicos OSINT
  "18+", "acervo", "adult", "adult content", "adul_content", "alt account", "alternative account", "ana leticia", "anúncios", "archive",
  "backup account", "backup profile", "backup", "baianinha", "bio link", "biograph", "biography", "blogging", "blue check", "booking",
  "bot", "brazil", "brazilian", "buy content", "buy my content", "cam girl", "camgirl", "casting", "chat", "check bio", "close friends",
  "coleção", "compartilhe", "conteudo", "content creator", "content", "creator", "custom content", "dados", "data mining", "dating",
  "discord", "dm for prices", "dms open", "domingo tem", "ensaios", "escort", "exclusive", "explicit", "feet", "filter bypass",
  "forum", "fotos", "freelance", "gp", "hiring", "hookup", "image", "instagram", "intimate", "investigation", "investigação",
  "kink", "leak", "leaked content", "leaked", "lewd", "liberal", "link", "linkinbio", "links", "live", "mega", "model", "modelo",
  "monetization", "nsfw", "nude", "nudes", "official", "onlyfans", "osint", "paid", "patreon", "photos", "pics", "platform",
  "portfolio", "ppv", "premium", "privacy", "private", "profile", "profiles", "programa", "rate", "real", "reference", "referencias",
  "research", "rss", "search", "sell", "sensual", "sigilo", "snap", "snapchat", "social", "stream", "streaming", "sub", "subscription",
  "sugar", "telegram", "tip", "tribute", "twitch", "unlocked", "verificado", "verified", "video", "videos", "vip", "webcam", "xxx",

  // Termos específicos Brasil
  "acompanhante", "acompanhante de luxo", "acompanhante executiva", "atendimento", "atendimento a domicílio", "atendimento com local",
  "atendimento vip", "baiana", "brasileira", "brasileiro", "carioca", "com local", "dominatrix", "faz programa", "garota programa",
  "gaúcha", "gostosa", "gostoso", "massagem", "massagem com final feliz", "massagem tântrica", "massagista", "massoterapia", "mineira",
  "nordestina", "novinha", "novinho", "paulista", "putaria", "relaxamento", "relaxamento profundo", "ritmo intenso", "sacanagem",
  "safadinha", "safadão", "satisfeita", "satisfeito", "sem frescura", "semprecinto", "sigilo absoluto", "sigiloso", "só para amigos",
  "submissiva", "terapeuta", "terapêutica", "tesuda", "webcamgirl br",

  // Termos internacionais
  "adultwork", "ahegao", "anime girl", "art nude", "ator", "atriz", "bdsmlr", "camboy", "camming", "casa das primas", "cock tribute",
  "cosplay lewd", "cosplay nsfw", "cumtribute", "dating profile", "dick rate", "discord server", "ecchi", "erotic photography",
  "femboy", "femdom", "fetish content", "findom", "foot fetish", "furry nsfw", "hentai", "hentai foundry", "hentai girl", "hire me",
  "implied nude", "instagram model", "join my vip", "kink friendly", "leaked content", "lingerie", "link in bio", "mega folder",
  "mega link", "model profile", "monetize seu conteúdo", "nofacefreak_18", "ofans", "pacotes promocionais", "paid content", "payperview",
  "portfolio link", "premium content", "premium snapchat", "privacy leak", "private account", "private content", "private snap",
  "produtor", "reels", "renda extra", "second account", "sell nudes", "selo azul", "snapcode", "sph", "sub4sub", "sugar baby",
  "sugar daddy", "superhq", "talenthouse", "telegram channel", "tip menu", "twitch streamer", "unlokme", "vip access", "vip content",
  "vídeos personalizados", "waifu", "youtube channel",

  // Termos OSINT técnicos
  "aggregator", "agregador", "alias", "analytics", "archives", "backdoor", "backup", "blockchain", "bot detection", "breach",
  "cache", "captcha", "crawler", "data breach", "database", "deep web", "digital footprint", "doxxing", "email", "extraction",
  "facial recognition", "forensics", "geolocation", "harvesting", "hash", "honeypot", "indexing", "intelligence", "leak detection",
  "metadata", "mining", "monitoring", "open source", "osint tools", "pattern", "pegasus", "phishing", "proxy", "reconnaissance",
  "scraping", "search engine", "social engineering", "sockpuppet", "steganography", "surveillance", "threat intelligence",
  "tor", "tracking", "verification", "vulnerability", "wayback", "web scraping", "whois",

  // Plataformas específicas mencionadas no JSON
  "4chan", "8kun", "adultfriendfinder", "ashley madison", "bedpage", "chaturbate", "classifiedads", "craiglist", "discord",
  "eros", "escort", "facebook", "fetlife", "imgur", "instagram", "kik", "listcrawler", "locanto", "megapersonals", "onlyfans",
  "reddit", "seekingarrangement", "skipthegames", "snapchat", "telegram", "tinder", "tryst", "twitter", "whatsapp", "xhamster",
  "xvideos", "yesbackpage",

  // Termos de investigação
  "background check", "data collection", "digital investigation", "evidence", "fact checking", "footprint analysis", "identity",
  "information gathering", "intelligence analysis", "link analysis", "network analysis", "online investigation", "open source intelligence",
  "pattern analysis", "person of interest", "profile analysis", "relationship mapping", "risk assessment", "social media analysis",
  "source verification", "timeline analysis", "verification process",

  // Categorias de conteúdo
  "casting disfarçado", "vazamento", "conteúdo vazado", "fórum adulto", "venda conteúdo íntimo", "acompanhantes", "agregadores",
  "indexadores", "cam sites", "adult sites", "escort services", "dating platforms", "social networks", "image hosting",
  "video hosting", "blog platforms", "portfolio sites", "linkinbio services"
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
