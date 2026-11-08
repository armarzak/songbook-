/* Local album art catalogue: only a small visible pool is animated, even in a large library. */
window.FireAlbumShelf=(()=>{
  let dispose=()=>{},signature='',firstSaved=false,savedPosition=0;
  const ranks=new Map();
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-яіїєґ0-9]+/g,'');
  const catalogue=[{"key":"album-1200809979","album":"Family бізнес","artist":"Бумбокс","songs":[{"artist":"Бумбокс","title":"Вахтерам"}]},{"key":"album-6778730184","album":"Сансара (feat. Диана Арбенина, Александр Ф. Скляр, Сергей Бобунец, SUNSAY, Скриптонит & АНТ) - Single","artist":"Баста","songs":[{"artist":"Баста","title":"Сансара"}]},{"key":"album-1122773394","album":"Viva La Vida or Death and All His Friends","artist":"Coldplay","songs":[{"artist":"Coldplay","title":"Viva La Vida"}]},{"key":"album-1122775993","album":"A Rush of Blood to the Head","artist":"Coldplay","songs":[{"artist":"Coldplay","title":"The Scientist"}]},{"key":"album-1122782080","album":"Parachutes","artist":"Coldplay","songs":[{"artist":"Coldplay","title":"Yellow"}]},{"key":"album-1517447039","album":"(What's the Story) Morning Glory?","artist":"Oasis","songs":[{"artist":"Oasis","title":"Wonderwall"}]},{"key":"album-1594677532","album":"Encanto (Original Motion Picture Soundtrack)","artist":"Sebastián Yatra","songs":[{"artist":"Misc Cartoons","title":"Encanto - Two Oruguitas"}]},{"key":"album-1022164257","album":"Dream Your Life Away (Special Edition)","artist":"Vance Joy","songs":[{"artist":"Vance Joy","title":"Riptide"}]},{"key":"album-171708494","album":"Desireless","artist":"Eagle-Eye Cherry","songs":[{"artist":"Eagle-Eye Cherry","title":"Save Tonight"}]},{"key":"album-1193673068","album":"Лошадка","artist":"Найк Борзов","songs":[{"artist":"Найк Борзов","title":"Последняя Песня"},{"artist":"Найк Борзов","title":"Лошадка"}]},{"key":"album-1193672358","album":"Супермен","artist":"Найк Борзов","songs":[{"artist":"Найк Борзов","title":"Супермен"},{"artist":"Найк Борзов","title":"Верхом На Звезде"},{"artist":"Найк Борзов","title":"Бардак В Голове"}]},{"key":"album-945578420","album":"By the Way","artist":"Red Hot Chili Peppers","songs":[{"artist":"Red Hot Chili Peppers","title":"Cant Stop"},{"artist":"Red hot chilli peppers","title":"Can’t stop"}]},{"key":"album-1452975975","album":"Chess Pieces: The Very Best of Chess Records","artist":"Chuck Berry","songs":[{"artist":"Chuck Berry","title":"Johnny B Goode"}]},{"key":"album-1193662822","album":"Заноза","artist":"Найк Борзов","songs":[{"artist":"Найк Борзов","title":"Одна Она"}]},{"key":"album-1440739556","album":"Away from the Sun","artist":"3 Doors Down","songs":[{"artist":"3 Doors Down","title":"Here Without You"}]},{"key":"album-1440725629","album":"Time of My Life (Deluxe Edition)","artist":"3 Doors Down","songs":[{"artist":"3 Doors Down","title":"When Youre Young"}]},{"key":"album-863843525","album":"The Best","artist":"Мумий Тролль","songs":[{"artist":"Мумий Тролль","title":"Владивосток 2000"},{"artist":"Мумий Тролль","title":"Контрабанды"},{"artist":"Мумий Тролль","title":"Такие девчонки"},{"artist":"Мумий Тролль","title":"Фантастика"},{"artist":"Мумий Тролль","title":"Это по любви"}]},{"key":"album-912363222","album":"Акустика","artist":"Lumen","songs":[{"artist":"Lumen","title":"Небеса"},{"artist":"Lumen","title":"Между Строчек"}]},{"key":"album-710507518","album":"Нет времени для любви","artist":"Lumen","songs":[{"artist":"Lumen","title":"С Тобой"}]},{"key":"album-373220996","album":"The Rembrandts: L.P.","artist":"The Rembrandts","songs":[{"artist":"The Rembrandts","title":"Ill Be There For You"}]},{"key":"album-1440823766","album":"Sadnecessary (Bonus Track Version)","artist":"Milky Chance","songs":[{"artist":"Milky Chance","title":"Stolen Dance"}]},{"key":"album-901876334","album":"Птица","artist":"Аукцыон","songs":[{"artist":"АукцЫон","title":"Дорога"}]},{"key":"album-1440737353","album":"Hopes and Fears","artist":"Keane","songs":[{"artist":"Keane","title":"Everybodys Changing"}]},{"key":"album-1445286850","album":"Somewhere Only We Know - EP","artist":"Keane","songs":[{"artist":"Keane","title":"Somewhere Only We Know"}]},{"key":"album-274782938","album":"From Dusk Till Dawn (Music from the Motion Picture)","artist":"Tito & Tarantula","songs":[{"artist":"Tito & Tarantula","title":"After Dark"}]},{"key":"album-1680106960","album":"Оранжевое настроение-IV","artist":"Чайф","songs":[{"artist":"Чайф","title":"Хей-Хей"}]},{"key":"album-1677600890","album":"Реальный мир","artist":"Чайф","songs":[{"artist":"Чайф","title":"Не Со Мной"}]},{"key":"album-1678487092","album":"Шекогали","artist":"Чайф","songs":[{"artist":"Чайф","title":"Аргентина - Ямайка 5-0"}]},{"key":"album-1723344391","album":"Будь как дома, Путник...","artist":"Король и Шут","songs":[{"artist":"Король и Шут","title":"Лесник"}]},{"key":"album-1723343325","album":"Камнем по голове","artist":"Король и Шут","songs":[{"artist":"ороль и Шут","title":"Камнем по голове"},{"artist":"Король и Шут","title":"Дурак и молния"}]},{"key":"album-1723347060","album":"Как в старой сказке","artist":"Король и Шут","songs":[{"artist":"Король и Шут","title":"Проклятый старый дом"}]},{"key":"album-1723344983","album":"Акустический альбом","artist":"Король и Шут","songs":[{"artist":"Король и Шут","title":"Прыгну со скалы"},{"artist":"Король и Шут","title":"Кукла колдуна"}]},{"key":"album-1723341986","album":"Жаль, нет ружья","artist":"Король и Шут","songs":[{"artist":"Король и Шут","title":"Медведь"}]},{"key":"album-1739752983","album":"Просвистела","artist":"ДДТ","songs":[{"artist":"ДДТ","title":"Что такое осень"},{"artist":"ДДТ","title":"Это всё"}]},{"key":"album-1739748431","album":"Мир номер ноль","artist":"ДДТ","songs":[{"artist":"ДДТ","title":"Метель"}]},{"key":"album-1739747110","album":"Метель августа","artist":"ДДТ","songs":[{"artist":"ДДТ","title":"Летели облака"}]},{"key":"album-1458962126","album":"Би-2","artist":"Би-2","songs":[{"artist":"Би-2","title":"Серебро"},{"artist":"Би-2","title":"Полковнику никто не пишет"},{"artist":"Би-2","title":"Варвара"}]},{"key":"album-1458962888","album":"Мяу кисс ми","artist":"Би-2","songs":[{"artist":"Би-2","title":"Моя любовь"}]},{"key":"album-1483044159","album":"В городе N","artist":"Uma2rman","songs":[{"artist":"Уматурман","title":"Прасковья"},{"artist":"Уматурман","title":"Проститься"},{"artist":"Уматурман","title":"Ночной дозор"}]},{"key":"album-1094704982","album":"Пой, весна","artist":"Uma2rman","songs":[{"artist":"Уматурман","title":"Налей мне"},{"artist":"Уматурман","title":"Токсины"}]},{"key":"album-1345371898","album":"Гранатовый альбом","artist":"Сплин","songs":[{"artist":"Сплин","title":"Выхода нет"},{"artist":"Сплин","title":"Орбит без сахара"},{"artist":"Сплин","title":"Бог устал нас любить"},{"artist":"Сплин","title":"Весь этот бред"}]},{"key":"album-1212111998","album":"25-й кадр","artist":"Сплин","songs":[{"artist":"Сплин","title":"Мое сердце"},{"artist":"Сплин","title":"Пой мне еще"},{"artist":"Сплин","title":"Линия жизни"}]},{"key":"album-1518191698","album":"Новые люди","artist":"Сплин","songs":[{"artist":"Сплин","title":"Новые люди"}]},{"key":"album-581098891","album":"Online","artist":"BrainStorm","songs":[{"artist":"Brainstorm","title":"Maybe"}]},{"key":"album-1754129231","album":"SWA","artist":"Калинов Мост","songs":[{"artist":"Калинов Мост","title":"Камчатка"}]},{"key":"album-1440766028","album":"Flamingo (Deluxe Edition)","artist":"Brandon Flowers","songs":[{"artist":"Brandon Flowers","title":"Crossfire"}]},{"key":"album-992088658","album":"Origin of Symmetry","artist":"Muse","songs":[{"artist":"Muse","title":"Feeling Good"}]},{"key":"album-1138290493","album":"Дайвер","artist":"SUNSAY","songs":[{"artist":"SunSay","title":"Дайвер"},{"artist":"SunSay","title":"Будь слабей меня"}]},{"key":"album-1138832699","album":"Легко","artist":"SUNSAY","songs":[{"artist":"SunSay","title":"Wind Song (ft John Forte)"}]},{"key":"album-1759279649","album":"Все лучшее в одном","artist":"5'nizza","songs":[{"artist":"5nizza","title":"Половина меня"},{"artist":"5nizza","title":"Ты такая"},{"artist":"5nizza","title":"Немає куль"}]},{"key":"album-1748566745","album":"Пятница","artist":"5'nizza","songs":[{"artist":"5nizza","title":"Ушедшим слишком рано"}]},{"key":"album-1754963530","album":"О5","artist":"5'nizza","songs":[{"artist":"5nizza","title":"Новый день"},{"artist":"5nizza","title":"Натяни"},{"artist":"5nizza","title":"Огонь и я"}]},{"key":"album-1458137859","album":"Singles","artist":"Travis","songs":[{"artist":"Travis","title":"Sing"},{"artist":"Travis","title":"Flowers In The Window"}]},{"key":"album-1443833959","album":"Lifehouse","artist":"Lifehouse","songs":[{"artist":"Lifehouse","title":"You And Me"}]},{"key":"album-1440768163","album":"No Name Face","artist":"Lifehouse","songs":[{"artist":"Lifehouse","title":"Everything"}]},{"key":"album-889074540","album":"Без консервантов","artist":"Lumen","songs":[{"artist":"Lumen","title":"Кофе"}]},{"key":"album-553455499","album":"Одной крови","artist":"Lumen","songs":[{"artist":"Lumen","title":"Мечта"}]},{"key":"album-1440858222","album":"Bad Blood (Bonus Track Version)","artist":"Bastille","songs":[{"artist":"Bastille","title":"Pompeii"}]},{"key":"album-6769439363","album":"Свобода","artist":"Lumen","songs":[{"artist":"Lumen","title":"Назови мне свое имя"}]},{"key":"album-865978813","album":"Морская (Deluxe)","artist":"Мумий Тролль","songs":[{"artist":"Мумий Тролль","title":"Девочка"},{"artist":"Мумий Тролль","title":"Забавы"}]},{"key":"album-869027888","album":"Икра (Deluxe)","artist":"Мумий Тролль","songs":[{"artist":"Мумий Тролль","title":"Дельфины"}]},{"key":"album-1485404456","album":"100 грамм для храбрости (Прими на грудь и слушай!)","artist":"Григорий Лепс","songs":[{"artist":"Григорий Лепс","title":"Рюмка водки"}]},{"key":"album-1050950113","album":"Капитал","artist":"Ляпис Трубецкой","songs":[{"artist":"Ляпис Трубецкой","title":"Капитал"}]},{"key":"album-1803164355","album":"Greatest Hits","artist":"Akvarium","songs":[{"artist":"Аквариум","title":"Козлодоев"}]},{"key":"album-1440769594","album":"Best of Hoobastank","artist":"Hoobastank","songs":[{"artist":"Hoobastank","title":"The Reason"}]},{"key":"album-1589963740","album":"ПРОСТИ МЕНЯ МОЯ ЛЮБОВЬ","artist":"Земфира","songs":[{"artist":"Земфира","title":"Хочешь"}]},{"key":"album-1652896563","album":"В диапазоне между отчаянием и надеждой","artist":"Порнофильмы","songs":[{"artist":"Порнофильмы","title":"Я так соскучился"}]},{"key":"album-1532722533","album":"Человеко-часы","artist":"Дайте Танк (!)","songs":[{"artist":"Дайте танк","title":"Люди"}]},{"key":"album-1724488123","album":"Beautiful Things - Single","artist":"Benson Boone","songs":[{"artist":"Benson Boone","title":"Beautiful Things"}]},{"key":"album-1440855456","album":"V (Deluxe)","artist":"Maroon 5","songs":[{"artist":"Maroon 5","title":"Sugar"}]},{"key":"album-300855107","album":"In Your Honor","artist":"Foo Fighters","songs":[{"artist":"Foo Fighters","title":"Best Of You"}]},{"key":"album-456563917","album":"Wasting Light","artist":"Foo Fighters","songs":[{"artist":"Foo Fighters","title":"Walk"},{"artist":"Foo Fighters","title":"Rope"}]},{"key":"album-262743410","album":"Echoes, Silence, Patience & Grace","artist":"Foo Fighters","songs":[{"artist":"Foo Fighters","title":"The Pretender"}]},{"key":"album-1440873107","album":"Night Visions","artist":"Imagine Dragons","songs":[{"artist":"Imagine Dragons","title":"Radioactive"},{"artist":"Imagine Dragons","title":"Demons"}]},{"key":"album-1440855747","album":"Night Visions (Deluxe Version)","artist":"Imagine Dragons","songs":[{"artist":"Imagine Dragons","title":"On Top Of The World"}]},{"key":"album-1443128938","album":"The Lateness Of The Hour","artist":"Alex Clare","songs":[{"artist":"Alex Clare","title":"Too Close"}]},{"key":"album-1452497420","album":"Жить в кайф","artist":"Max Korzh","songs":[{"artist":"Макс Корж","title":"Жить в кайф"}]},{"key":"album-1112971476","album":"Баста 5, Часть 2","artist":"Баста","songs":[{"artist":"Баста","title":"Выпускной (Медлячок)"}]},{"key":"album-1333012313","album":"Чёрный альбом","artist":"Кино","songs":[{"artist":"Виктор Цой (Кино)","title":"Кукушка"}]},{"key":"album-1224738148","album":"Вверх, Ч. 1","artist":"А-Мега","songs":[{"artist":"Амега","title":"Лететь"}]},{"key":"album-310527525","album":"Love Songs","artist":"Grover Washington, Jr.","songs":[{"artist":"Grover Washington Jr","title":"Just The Two Of Us"}]},{"key":"album-290302885","album":"Only By the Night","artist":"Kings of Leon","songs":[{"artist":"Kings of Leon","title":"Use Somebody"},{"artist":"Kings Of Leon","title":"Sex On Fire"}]},{"key":"album-457503067","album":"Come Around Sundown (Expanded Edition)","artist":"Kings of Leon","songs":[{"artist":"Kings of Leon","title":"Pyro"}]},{"key":"album-207928114","album":"Snow (Hey Oh) - Single","artist":"Red Hot Chili Peppers","songs":[{"artist":"Red Hot Chili Peppers","title":"Snow Hey Oh"}]},{"key":"album-1444206214","album":"The Belt","artist":"In The Valley Below","songs":[{"artist":"In The Valley Below","title":"Peaches"}]},{"key":"album-945575406","album":"Californication (Remastered)","artist":"Red Hot Chili Peppers","songs":[{"artist":"Red hot chili peppers","title":"Road tripping"},{"artist":"Red Hot Chili Peppers","title":"Californication"}]},{"key":"album-973481485","album":"The Best Of","artist":"BrainStorm","songs":[{"artist":"Brainstorm","title":"Ветер"},{"artist":"Brainstorm","title":"Ты не один"},{"artist":"BrainStorm","title":"Выходные"}]},{"key":"album-1598185566","album":"13","artist":"Пилот","songs":[{"artist":"Пилот","title":"Сердце машины"}]},{"key":"album-1754310149","album":"Оружие","artist":"Калинов Мост","songs":[{"artist":"Калинов мост","title":"Родная"}]},{"key":"album-1748086558","album":"Детям до 16","artist":"После 11","songs":[{"artist":"После 11","title":"Крылья"}]},{"key":"album-1333010977","album":"Группа крови","artist":"Кино","songs":[{"artist":"Виктор Цой (Кино)","title":"Группа крови"}]},{"key":"album-1393041713","album":"Лето (Песня для Цоя)","artist":"Кино","songs":[{"artist":"Виктор Цой (Кино)","title":"Восьмиклассница"}]},{"key":"album-1795795646","album":"Кухни - Single","artist":"Бонд с кнопкой","songs":[{"artist":"Бонд с кнопкой","title":"Кухни"}]},{"key":"album-1103393546","album":"Песня о безответной любви к родине","artist":"Nol","songs":[{"artist":"Ноль","title":"Человек и кошка"}]},{"key":"album-1053390705","album":"Ты кинула","artist":"Ляпис Трубецкой","songs":[{"artist":"Ляпис Трубецкой","title":"В платье белом"}]},{"key":"album-1871484306","album":"Кома","artist":"Крематорий","songs":[{"artist":"Крематорий","title":"Мусорный ветер"}]},{"key":"album-1534305212","album":"Одуванчики Для Канареек","artist":"Мёртвые Дельфины","songs":[{"artist":"Мертвые Дельфины","title":"На моей луне"}]},{"key":"album-1117387490","album":"AZXV: Акустика","artist":"Animal Jazz","songs":[{"artist":"Animal ДжаZ","title":"Три Полоски"}]},{"key":"album-1482666167","album":"Время любить","artist":"Animal Jazz","songs":[{"artist":"Animal ДжаZ","title":"Чувства"}]},{"key":"album-1108054225","album":"Stereotest","artist":"BoBRy","songs":[{"artist":"Бобры","title":"Тихой сапой"}]},{"key":"album-1108078541","album":"Музыку давай!","artist":"БоБРы","songs":[{"artist":"Бобры","title":"Эй, музыкант"},{"artist":"Бобры","title":"Юра едет в ЮАР"}]},{"key":"album-1626576324","album":"Диссонанс (неполная версия)","artist":"Lumen","songs":[{"artist":"Lumen","title":"Догонять"}]},{"key":"album-1753998374","album":"Руда","artist":"Калинов Мост","songs":[{"artist":"Калинов Мост","title":"Брату"}]},{"key":"album-1615638052","album":"В мире много сказок. Песни для детей.","artist":"Владимир Ферапонтов","songs":[{"artist":"Песни из кино и мультфильмов","title":"Я играю на гармошке"}]},{"key":"album-1575660901","album":"Песни для детей и их родителей. Выпуск 1","artist":"Оля Королькова & Big Children's Choir","songs":[{"artist":"Песни из кино и мультфильмов","title":"Прекрасное далеко"},{"artist":"Песни из кино и мультфильмов","title":"33 коровы"}]},{"key":"album-708387537","album":"Лучшие Песни","artist":"Marina Devyatova","songs":[{"artist":"Песни из кино и мультфильмов","title":"Кабы не было зимы"}]},{"key":"album-1237739780","album":"Актер и песня","artist":"Pavel Smeyan","songs":[{"artist":"Песни из кино и мультфильмов","title":"Ветер перемен"}]},{"key":"album-1586357662","album":"Кофе и сигареты","artist":"Сегодняночью","songs":[{"artist":"Сегодня ночью","title":"Сигареты и кофе"}]},{"key":"album-1793776899","album":"Хиты 90-х","artist":"Валерий Сюткин","songs":[{"artist":"Валерий Сюткин","title":"Я то что надо"}]},{"key":"album-1046951875","album":"Дорога в облака","artist":"Bravo","songs":[{"artist":"Браво","title":"Дорога в облака"},{"artist":"Браво","title":"Любите Девушки"}]},{"key":"album-1565157915","album":"Ветер знает... - EP","artist":"Браво","songs":[{"artist":"Браво","title":"Этот город"}]},{"key":"album-1047210295","album":"На перекрёстках весны","artist":"Браво","songs":[{"artist":"Браво","title":"Ветер Знает"}]},{"key":"album-1126308161","album":"The Best Of","artist":"Браво","songs":[{"artist":"Браво","title":"Как Жаль"},{"artist":"Браво","title":"Это За Окном Рассвет"}]},{"key":"album-1046951806","album":"Стиляги из Москвы","artist":"Браво","songs":[{"artist":"Браво","title":"Черный Кот"}]},{"key":"album-1679849414","album":"Creep - EP","artist":"Radiohead","songs":[{"artist":"Radiohead","title":"Creep"}]},{"key":"album-1097862703","album":"The Bends","artist":"Radiohead","songs":[{"artist":"Radiohead","title":"Fake plastic trees"}]},{"key":"album-1097861387","album":"OK Computer","artist":"Radiohead","songs":[{"artist":"Radiohead","title":"Karma Police"},{"artist":"Radiohead","title":"No Surprises"}]},{"key":"album-380907762","album":"Hunting High and Low (Deluxe Edition)","artist":"a-ha","songs":[{"artist":"A-ha","title":"Take On Me"}]},{"key":"album-392429592","album":"25 (Deluxe Version)","artist":"a-ha","songs":[{"artist":"a-ha","title":"Summer Moved On"},{"artist":"a-ha","title":"Lifelines"},{"artist":"a-ha","title":"Forever Not Yours"},{"artist":"a-ha","title":"Velvet"}]},{"key":"album-1612543823","album":"Violator  The 12\" Singles","artist":"Depeche Mode","songs":[{"artist":"Depeche Mode","title":"Enjoy The Silence"},{"artist":"Depeche Mode","title":"Personal Jesus Acoustic"}]},{"key":"album-394992805","album":"Young the Giant","artist":"Young the Giant","songs":[{"artist":"Young the Giant","title":"Cough Syrup"}]},{"key":"album-1854584759","album":"Бременские музыканты. Трилогия","artist":"Gennadiy Gladkov","songs":[{"artist":"Песни из кино и мультфильмов","title":"Говорят, мы бяки-буки"}]},{"key":"album-1796442495","album":"Радость простых мелодий","artist":"Peter Nalitch","songs":[{"artist":"Петр Налич","title":"Guitar"}]},{"key":"album-1483044159","album":"Обложка исполнителя","artist":"Uma2rman","songs":[{"artist":"Уматурман","title":"Эй, толстый"}],"kind":"artist"},{"key":"album-1183512457","album":"Смирись и расслабься!","artist":"Valentin Strykalo","songs":[{"artist":"Валентин Стрыкало","title":"Наше лето"}]},{"key":"album-972770057","album":"Izlase 2000 - 2010","artist":"BrainStorm","songs":[{"artist":"Brainstorm","title":"Скользкие улицы"}]},{"key":"album-1485944481","album":"Наизусть","artist":"Амели на Мели","songs":[{"artist":"Амели на мели","title":"Забыть её слова"}]},{"key":"album-1759279649","album":"Обложка исполнителя","artist":"5'nizza","songs":[{"artist":"5nizza","title":"Гимн СССР"}],"kind":"artist"},{"key":"album-1759279649","album":"Обложка исполнителя","artist":"5'nizza","songs":[{"artist":"5nizza","title":"To Bob Marley (Jamming)"}],"kind":"artist"},{"key":"album-1630908793","album":"SunSay","artist":"SUNSAY","songs":[{"artist":"5nizza","title":"Карма"}]},{"key":"album-863843525","album":"Обложка исполнителя","artist":"Мумий Тролль","songs":[{"artist":"Мумий Тролль","title":"Малыш"}],"kind":"artist"},{"key":"album-1624038957","album":"О любви","artist":"The Chizh & Co","songs":[{"artist":"Чиж","title":"О любви"}]},{"key":"album-1103292477","album":"Сука любовь","artist":"Mihey & Jumanji","songs":[{"artist":"Михей и Джуманджи","title":"Туда"},{"artist":"Михей и Джуманджи","title":"Сука-любовь"}]},{"key":"album-1677598599","album":"Давай вернёмся","artist":"Chaif","songs":[{"artist":"Чайф","title":"Ой-йо"}]},{"key":"album-1795406738","album":"Детство","artist":"Ilya Chert","songs":[{"artist":"Пилот","title":"Блюз чих-пых"}]},{"key":"album-1506946512","album":"Puls 200","artist":"TOKiO","songs":[{"artist":"Токио","title":"Кто я без тебя"},{"artist":"Токио","title":"Когда ты плачешь (Помоги мне)"}]},{"key":"album-1142647752","album":"Сны","artist":"Chicherina","songs":[{"artist":"Чичерина","title":"Ту-Лу-Ла"}]},{"key":"album-1300144264","album":"#Войнаимир","artist":"Chicherina","songs":[{"artist":"Чичерина","title":"Уходя-Уходи"}]},{"key":"album-1755748251","album":"Братья Гримм","artist":"Bratiya Grim","songs":[{"artist":"Братья Грим","title":"Ресницы"},{"artist":"Братья Грим","title":"Кустурица"}]},{"key":"album-1602692751","album":"Вне зоны доступа","artist":"Город 312","songs":[{"artist":"Город 312","title":"Останусь"},{"artist":"Город 312","title":"Вне Зоны Доступа"}]},{"key":"album-1396534518","album":"Маленькие девочки","artist":"Ruki Vverkh","songs":[{"artist":"Руки Вверх!","title":"Алёшка"}]},{"key":"album-588212069","album":"Трудный возраст","artist":"MakSim","songs":[{"artist":"МакSим","title":"Знаешь Ли Ты"}]},{"key":"album-197053655","album":"The Essential Redbone","artist":"Redbone","songs":[{"artist":"Redbone","title":"Come and get your love"}]},{"key":"album-1109658139","album":"Dizzy Up the Girl","artist":"The Goo Goo Dolls","songs":[{"artist":"Goo Goo Dolls","title":"Iris"}]},{"key":"album-590427297","album":"Minutes to Midnight (Deluxe Edition)","artist":"LINKIN PARK","songs":[{"artist":"Linkin Park","title":"What Ive Done"},{"artist":"Linkin Park","title":"Leave Out All The Rest"}]},{"key":"album-1003779288","album":"What Went Down","artist":"Foals","songs":[{"artist":"Foals","title":"Mountain At My Gates"}]},{"key":"album-1434371867","album":"A Star Is Born Soundtrack","artist":"Lady Gaga & Bradley Cooper","songs":[{"artist":"Lady Gaga & Bradley Cooper","title":"Shallow"}]},{"key":"album-1179008699","album":"Хроника бешеных дней","artist":"Lumen","songs":[{"artist":"Люмен","title":"Истина"}]},{"key":"album-314350001","album":"Strike!","artist":"The Baseballs","songs":[{"artist":"Umbrella","title":"The Baseballs"}]},{"key":"album-367762323","album":"Strike!","artist":"The Baseballs","songs":[{"artist":"The Baseballs","title":"Hot N Cold Acoustic"}]},{"key":"album-590423275","album":"Meteora (Deluxe Edition)","artist":"LINKIN PARK","songs":[{"artist":"Linkin Park","title":"Breaking The Habit"}]}];
  const lookup=new Map();
  catalogue.forEach(a=>a.songs.forEach(s=>lookup.set(norm(s.artist)+'|'+norm(s.title),a)));
  function stop(){dispose();dispose=()=>{};signature=''}
  function mount(root,songs,open){
    if(!root)return;
    const seen=new Set(),items=[];
    songs.forEach(s=>{
      const key=norm(s.artist)+'|'+norm(s.title),a=lookup.get(key);
      if(a&&!seen.has(key)){items.push({a,s});seen.add(key)}
    });
    // A fresh order per page launch; keep it while navigating within this launch.
    items.forEach(x=>{if(!ranks.has(x.s.id))ranks.set(x.s.id,Math.random())});
    items.sort((a,b)=>ranks.get(a.s.id)-ranks.get(b.s.id));
    if(!firstSaved&&items.length){
      try{
        const previous=localStorage.getItem('fc.carousel.first');
        if(items.length>1&&items[0].s.id===previous){
          const a=items[0],b=items[1],rank=ranks.get(a.s.id);ranks.set(a.s.id,ranks.get(b.s.id));ranks.set(b.s.id,rank);items[0]=b;items[1]=a;
        }
        localStorage.setItem('fc.carousel.first',items[0].s.id);
      }catch{}
      firstSaved=true;
    }
    const key=items.map(x=>x.s.id+':'+x.s.title+':'+x.s.artist).join('|');
    if(key===signature&&root.querySelector('.album-shelf-stage'))return;
    stop();root.replaceChildren();root.hidden=items.length<2;if(root.hidden)return;signature=key;
    root.innerHTML='<div class="album-shelf-head"><h2>Твоя музыка</h2></div><div class="album-shelf-stage" role="group" aria-roledescription="карусель" aria-label="Песни по обложкам альбомов. Можно листать свайпом или клавишами со стрелками."></div><p class="album-shelf-caption"><strong></strong><span></span></p>';
    const stage=root.querySelector('.album-shelf-stage'),caption=root.querySelector('.album-shelf-caption');
    stage.style.opacity='0';
    let pos=savedPosition,raf=0,last=0,visible=true,hover=false,focused=false,pointer=null,dragged=false,width=0,size=132,selected=-1,closed=false,ready=false,momentum=0,settleTarget=null,resumeAt=0,touchId=null;
    const buttons=Array.from({length:Math.min(items.length,9)},()=>{
      const b=document.createElement('button');b.type='button';b.className='album-cover';b.songIndex=-1;b.imageReady=false;b.imageFailed=false;b.loadToken=0;b.style.visibility='hidden';
      const img=document.createElement('img');img.width=300;img.height=300;img.draggable=false;b.append(img);
      b.addEventListener('click',e=>{if((!dragged||e.detail===0)&&b.songIndex>=0)open(items[b.songIndex].s.id)});stage.append(b);return b;
    });
    function draw(){
      if(!root.isConnected){stop();return}
      const total=items.length,step=size*.92;pos=((pos%total)+total)%total;
      const base=Math.floor(pos),fraction=pos-base,start=-Math.floor(buttons.length/2);
      const targets=buttons.map((_,k)=>({relative:k+start,index:(base+k+start+total)%total}));
      const needed=new Set(targets.map(x=>x.index));
      const current=new Map(buttons.map(b=>[b.songIndex,b]));
      const free=buttons.filter(b=>!needed.has(b.songIndex));
      const visibleCards=[];
      targets.forEach(({relative,index})=>{
        const b=current.get(index)||free.shift(),d=relative-fraction,x=d*step;
        const edge=Math.min(1,Math.abs(x)/(width*.55||1)),shown=Math.abs(x)<width/2+size/3;
        if(b.songIndex!==index){
          b.songIndex=index;const {a,s}=items[index],img=b.firstElementChild,src='album-art/'+a.key+'.jpg';
          b.setAttribute('aria-label','Открыть «'+s.title+'» — '+s.artist);img.alt=a.artist+' — '+a.album;
          if(img.getAttribute('src')===src&&img.complete&&img.naturalWidth){b.imageReady=true;b.imageFailed=false}
          else{
            b.imageReady=false;b.imageFailed=false;b.style.visibility='hidden';const token=++b.loadToken;
            const loaded=()=>{if(closed||token!==b.loadToken)return;b.imageReady=!!(img.complete&&img.naturalWidth);b.imageFailed=!b.imageReady;draw()};
            img.onload=()=>{if(img.decode)img.decode().then(loaded,loaded);else loaded()};
            img.onerror=()=>{if(closed||token!==b.loadToken)return;b.imageFailed=true;draw()};
            img.src=src;if(img.complete)img.onload();
          }
        }
        b.style.transform=`translateX(calc(-50% + ${x.toFixed(2)}px)) rotateY(${(-edge*68*Math.sign(d)).toFixed(2)}deg) scale(${(1-edge*.12).toFixed(3)})`;
        b.style.zIndex=String(100-Math.round(Math.abs(d)*10));b.style.opacity=String(Math.max(0,1-Math.max(0,edge-.72)*1.5));
        b.style.visibility=shown&&b.imageReady?'visible':'hidden';b.tabIndex=shown&&b.imageReady?0:-1;
        if(shown)visibleCards.push(b);
      });
      if(!ready&&visibleCards.length&&visibleCards.every(b=>b.imageReady||b.imageFailed)){ready=true;stage.style.opacity='1';sync()}
      const i=Math.round(pos)%total;
      if(i!==selected){selected=i;caption.firstElementChild.textContent=items[i].s.title;caption.lastElementChild.textContent=items[i].s.artist}
    }
    function canRun(){
      return !closed&&ready&&visible&&!document.hidden&&!pointer&&
        (Math.abs(momentum)>.00015||settleTarget!==null||(!hover&&!focused));
    }
    function tick(t){
      raf=0;if(closed)return;const dt=last?Math.min(t-last,40):0;last=t;
      if(Math.abs(momentum)>.00015){
        pos+=momentum*dt;momentum*=Math.exp(-dt/180);
        if(Math.abs(momentum)<=.00015){momentum=0;settleTarget=Math.round(pos)}
      }else if(settleTarget!==null){
        let distance=settleTarget-pos;distance-=Math.round(distance/items.length)*items.length;
        if(Math.abs(distance)<.003){pos=settleTarget;settleTarget=null;resumeAt=t+1200}
        else pos+=distance*(1-Math.exp(-dt/60));
      }else if(t>=resumeAt&&!hover&&!focused)pos+=dt/4800;
      draw();if(canRun())raf=requestAnimationFrame(tick);
    }
    function sync(){cancelAnimationFrame(raf);raf=0;last=0;if(canRun())raf=requestAnimationFrame(tick)}
    function resize(){width=stage.clientWidth;size=buttons[0].offsetWidth;draw()}
    const ro=new ResizeObserver(resize);ro.observe(stage);
    const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()});io.observe(stage);
    const visibility=()=>{if(document.hidden){pointer=null;touchId=null;momentum=0;settleTarget=null;dragged=false}sync()};document.addEventListener('visibilitychange',visibility);
    stage.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;sync()}});
    stage.addEventListener('pointerleave',()=>{hover=false;sync()});
    stage.addEventListener('focusin',()=>{focused=true;sync()});stage.addEventListener('focusout',e=>{focused=stage.contains(e.relatedTarget);sync()});
    stage.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();dragged=false;momentum=0;settleTarget=Math.round(pos)+(e.key==='ArrowRight'?1:-1);sync();
      }
    });
    const stamp=e=>Number.isFinite(e.timeStamp)?e.timeStamp:performance.now();
    const nativeTouch='ontouchstart' in window;
    function beginGesture(id,x,y,type,time,source){
      if(pointer)return false;
      momentum=0;settleTarget=null;
      pointer={id,type,source,x,y,pos,lastX:x,t:time,velocity:0};
      dragged=false;sync();return true;
    }
    function moveGesture(id,x,y,time){
      if(!pointer||id!==pointer.id)return false;
      const dx=x-pointer.x,dy=y-pointer.y;
      if(!dragged&&Math.abs(dy)>6&&Math.abs(dy)>Math.abs(dx)){
        // Let Safari own a vertical page scroll for the rest of this gesture.
        pointer=null;focused=false;sync();return false;
      }
      if(!dragged&&Math.abs(dx)>4&&Math.abs(dx)>Math.abs(dy)){
        dragged=true;focused=false;
        if(pointer.source==='pointer')try{stage.setPointerCapture(id)}catch{}
      }
      if(!dragged)return false;
      const dt=Math.max(8,time-pointer.t),step=size*.92;
      const velocity=-(x-pointer.lastX)/dt*1.8/step;
      pointer.velocity=Math.max(-.012,Math.min(.012,pointer.velocity*.35+velocity*.65));
      pointer.lastX=x;pointer.t=time;
      pos=pointer.pos-dx*1.8/step;draw();return true;
    }
    function finishGesture(id,time,released){
      if(!pointer||id!==pointer.id)return false;
      const p=pointer,wasDrag=dragged;pointer=null;
      if(wasDrag){
        focused=false;if(p.type!=='mouse')hover=false;
        momentum=released&&time-p.t<100?p.velocity:0;
        if(Math.abs(momentum)<=.00015){momentum=0;settleTarget=Math.round(pos)}
        resumeAt=performance.now()+1200;
      }
      sync();return wasDrag;
    }
    stage.addEventListener('pointerdown',e=>{
      if(e.button>0||(nativeTouch&&e.pointerType==='touch'))return;
      beginGesture(e.pointerId,e.clientX,e.clientY,e.pointerType,stamp(e),'pointer');
    });
    stage.addEventListener('pointermove',e=>{
      if(!pointer||pointer.source!=='pointer')return;
      if(moveGesture(e.pointerId,e.clientX,e.clientY,stamp(e))&&e.cancelable)e.preventDefault();
    });
    const end=e=>{
      if(!pointer||pointer.source!=='pointer')return;
      finishGesture(e.pointerId,stamp(e),e.type==='pointerup');
    };
    window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
    // Native Touch Events keep iPhone drags alive when Safari cancels Pointer Events.
    const findTouch=(list,id)=>Array.from(list||[]).find(t=>t.identifier===id);
    const touchStart=e=>{
      if(e.touches.length!==1){if(pointer&&pointer.source==='touch')finishGesture(pointer.id,stamp(e),false);touchId=null;return}
      if(!nativeTouch||touchId!==null)return;
      const t=e.touches[0];
      if(beginGesture(t.identifier,t.clientX,t.clientY,'touch',stamp(e),'touch'))touchId=t.identifier;
    };
    const touchMove=e=>{
      if(touchId===null)return;
      if(e.touches.length!==1){finishGesture(touchId,stamp(e),false);touchId=null;return}
      const t=findTouch(e.touches,touchId);
      if(t&&moveGesture(t.identifier,t.clientX,t.clientY,stamp(e))&&e.cancelable)e.preventDefault();
    };
    const touchEnd=e=>{
      if(touchId===null||!findTouch(e.changedTouches,touchId))return;
      const id=touchId;touchId=null;
      if(finishGesture(id,stamp(e),e.type==='touchend')&&e.cancelable)e.preventDefault();
    };
    stage.addEventListener('touchstart',touchStart,{passive:true});
    stage.addEventListener('touchmove',touchMove,{passive:false});
    window.addEventListener('touchend',touchEnd,{passive:false});
    window.addEventListener('touchcancel',touchEnd,{passive:false});
    dispose=()=>{window.removeEventListener('touchend',touchEnd);window.removeEventListener('touchcancel',touchEnd);savedPosition=pos;closed=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end)};
    resize();sync();
  }
  function artFor(song){
    const a=song&&lookup.get(norm(song.artist)+'|'+norm(song.title));
    return a?{src:'album-art/'+a.key+'.jpg',alt:a.artist+' — '+a.album}:null;
  }
  return {mount,stop,artFor};
})();
