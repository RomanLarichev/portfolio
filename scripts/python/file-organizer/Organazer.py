import hashlib
import json
import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


def setup_logging():
    """Настройка логирования"""
    log_file = Path.home() / 'Downloads' / 'file_organizer.log'
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )


def get_file_hash(file_path: Path, buffer_size: int = 65536) -> str:
    """
    Вычисляет MD5 хеш файла для сравнения содержимого.
    Используется для обнаружения точных дубликатов.
    """
    md5_hash = hashlib.md5()

    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(buffer_size):
                md5_hash.update(chunk)
    except (IOError, OSError) as e:
        logging.warning(f"Не удалось вычислить хеш для {file_path}: {e}")
        return ""

    return md5_hash.hexdigest()


def get_category_mappings() -> Dict[str, List[str]]:
    """Расширенный список категорий"""
    return {
        'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff'],
        'Documents': ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.xlsx', '.xls', '.pptx', '.odt', '.odp', '.ods'],
        'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
        'Scripts': ['.py', '.js', '.java', '.cpp', '.c', '.h', '.html', '.css', '.php', '.sh', '.bat'],
        'Videos': ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'],
        'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'],
        'Executables': ['.exe', '.msi', '.dmg', '.apk', '.app', '.deb', '.rpm'],
        'Fonts': ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
        'Data': ['.csv', '.json', '.xml', '.sql', '.db', '.sqlite', '.yaml', '.yml'],
        'Presentations': ['.ppt', '.pptx', '.key'],
        'Ebooks': ['.epub', '.mobi', '.azw3'],
        'Torrents': ['.torrent'],
        'Certificates': ['.pem', '.crt', '.key', '.cer', '.pfx'],
        'Configs': ['.ini', '.cfg', '.conf', '.properties']
    }


class FileOrganizer:
    def __init__(self, source_folder: Optional[Path] = None, dry_run: bool = False):
        self.source_folder = source_folder or Path.home() / 'Downloads'
        self.dry_run = dry_run
        self.categories = get_category_mappings()
        self.stats = {
            'processed': 0,
            'moved': 0,
            'renamed': 0,
            'duplicates_found': 0,
            'duplicates_removed': 0,
            'errors': 0,
            'skipped': 0
        }
        self.hash_cache = {}  # Кэш для хешей файлов
        self.name_cache = {}  # Кэш для имен файлов (без учета регистра)

    def get_unique_filename(self, file_path: Path, target_folder: Path) -> Optional[Path]:
        """
        Генерирует уникальное имя файла, если файл с таким именем уже существует.
        Возвращает путь с уникальным именем.
        """
        original_name = file_path.name
        name_parts = original_name.rsplit('.', 1)
        base_name = name_parts[0]
        extension = f".{name_parts[1]}" if len(name_parts) > 1 else ""

        counter = 1
        new_name = original_name
        new_path = target_folder / new_name

        # Проверяем существование файла
        while new_path.exists():
            # Проверяем, является ли файл точным дубликатом
            if self.is_exact_duplicate(file_path, new_path):
                logging.info(f"Найден точный дубликат: {file_path.name} -> {new_path.name}")
                self.stats['duplicates_found'] += 1

                # Удаляем дубликат в зависимости от настроек
                if not self.dry_run:
                    try:
                        file_path.unlink()
                        self.stats['duplicates_removed'] += 1
                        logging.info(f"Удален дубликат: {file_path.name}")
                    except Exception as e:
                        logging.error(f"Не удалось удалить дубликат {file_path.name}: {e}")
                        self.stats['errors'] += 1
                else:
                    logging.info(f"[DRY RUN] Был бы удален дубликат: {file_path.name}")

                return None  # Файл-дубликат, не нужно перемещать

            # Если не дубликат, генерируем новое имя
            new_name = f"{base_name}_{counter}{extension}"
            new_path = target_folder / new_name
            counter += 1

            # Защита от бесконечного цикла
            if counter > 100:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                new_name = f"{base_name}_{timestamp}{extension}"
                new_path = target_folder / new_name
                break

        return new_path

    def is_exact_duplicate(self, file1: Path, file2: Path) -> bool:
        """
        Проверяет, являются ли два файла точными дубликатами.
        Сначала сравнивает размер, затем хеш содержимого.
        """
        # Быстрая проверка по размеру
        try:
            if file1.stat().st_size != file2.stat().st_size:
                return False
        except (OSError, IOError):
            return False

        # Проверка по хешу
        hash1 = self.hash_cache.get(file1)
        if hash1 is None:
            hash1 = get_file_hash(file1)
            self.hash_cache[file1] = hash1

        hash2 = self.hash_cache.get(file2)
        if hash2 is None:
            hash2 = get_file_hash(file2)
            self.hash_cache[file2] = hash2

        return hash1 and hash2 and hash1 == hash2

    @staticmethod
    def check_case_insensitive_duplicate(filename: str, target_folder: Path) -> bool:
        """
        Проверяет наличие файла с тем же именем без учета регистра.
        Важно для Windows/Linux совместимости.
        """
        for existing_file in target_folder.iterdir():
            if existing_file.is_file() and existing_file.name.lower() == filename.lower():
                return True
        return False

    def create_category_folders(self):
        """Создает папки категорий, если они не существуют"""
        for category in self.categories.keys():
            category_path = self.source_folder / category
            if not category_path.exists():
                if not self.dry_run:
                    category_path.mkdir(parents=True, exist_ok=True)
                    logging.info(f"Создана папка: {category}")
                else:
                    logging.info(f"[DRY RUN] Была бы создана папка: {category}")
            else:
                logging.debug(f"Папка уже существует: {category}")

    def organize_files(self) -> bool:
        """Основная функция организации файлов"""
        if not self.source_folder.exists():
            logging.error(f"Папка '{self.source_folder}' не найдена!")
            return False

        # Создаем папки категорий
        self.create_category_folders()

        # Сначала собираем все файлы для обработки
        files_to_process = []
        for item in self.source_folder.iterdir():
            if item.is_file() and not item.name.startswith('.') and item.suffix != '.log':
                files_to_process.append(item)

        self.stats['processed'] = len(files_to_process)

        # Обрабатываем файлы
        for file_path in files_to_process:
            self.process_file(file_path)

        return True

    def process_file(self, file_path: Path):
        """Обрабатывает один файл"""
        file_ext = file_path.suffix.lower()
        moved = False

        for category, extensions in self.categories.items():
            if file_ext in extensions:
                target_folder = self.source_folder / category

                # Проверяем и получаем уникальное имя
                unique_path = self.get_unique_filename(file_path, target_folder)

                if unique_path is None:
                    # Файл был удален как дубликат
                    moved = True
                    break

                # Если файл с таким именем уже существует (без учета регистра)
                if self.check_case_insensitive_duplicate(unique_path.name, target_folder):
                    logging.warning(f"Файл с похожим именем (регистр) уже существует: {unique_path.name}")

                # Перемещаем файл
                try:
                    if not self.dry_run:
                        shutil.move(str(file_path), str(unique_path))
                        self.stats['moved'] += 1

                        if file_path.name != unique_path.name:
                            self.stats['renamed'] += 1
                            logging.info(
                                f"Перемещен с переименованием: {file_path.name} -> {category}/{unique_path.name}")
                        else:
                            logging.info(f"Перемещен: {file_path.name} -> {category}/")
                    else:
                        if file_path.name != unique_path.name:
                            logging.info(
                                f"[DRY RUN] Был бы перемещен с переименованием: {file_path.name} -> {category}/{unique_path.name}")
                        else:
                            logging.info(f"[DRY RUN] Был бы перемещен: {file_path.name} -> {category}/")

                    moved = True
                    break

                except Exception as e:
                    logging.error(f"Ошибка при перемещении {file_path.name}: {e}")
                    self.stats['errors'] += 1
                    moved = True  # Помечаем как обработанный, даже с ошибкой
                    break

        if not moved:
            # Файл не подошел ни под одну категорию
            logging.debug(f"Неизвестный формат: {file_path.name} ({file_ext})")
            self.stats['skipped'] += 1

    def find_all_duplicates(self, recursive: bool = True) -> Dict[str, List[Path]]:
        """
        Находит все дубликаты файлов в исходной папке.
        Возвращает словарь: хеш -> список путей к файлам
        """
        duplicates = {}

        # Собираем все файлы
        if recursive:
            all_files = list(self.source_folder.rglob('*'))
        else:
            all_files = list(self.source_folder.iterdir())

        all_files = [f for f in all_files if f.is_file() and not f.name.startswith('.')]

        # Вычисляем хеши
        logging.info(f"Поиск дубликатов среди {len(all_files)} файлов...")

        for file_path in all_files:
            try:
                file_hash = get_file_hash(file_path)
                if file_hash:
                    if file_hash not in duplicates:
                        duplicates[file_hash] = []
                    duplicates[file_hash].append(file_path)
            except Exception as e:
                logging.warning(f"Не удалось обработать файл {file_path}: {e}")

        # Фильтруем только дубликаты (хеши с более чем одним файлом)
        return {h: files for h, files in duplicates.items() if len(files) > 1}

    def remove_duplicates(self, keep_oldest: bool = True):
        """
        Удаляет дубликаты файлов, оставляя только одну копию.
        По умолчанию оставляет самую старую версию.
        """
        duplicates = self.find_all_duplicates()

        if not duplicates:
            logging.info("Дубликаты не найдены.")
            return

        total_duplicates = sum(len(files) - 1 for files in duplicates.values())
        logging.info(f"Найдено {len(duplicates)} групп дубликатов, всего {total_duplicates} файлов-дубликатов")

        removed_count = 0

        for file_hash, files in duplicates.items():
            # Сортируем файлы по времени создания
            files_with_mtime = [(f, f.stat().st_mtime) for f in files]
            files_with_mtime.sort(key=lambda x: x[1])

            # Оставляем первый файл (самый старый или самый новый в зависимости от настроек)
            if not keep_oldest:
                files_with_mtime = files_with_mtime[::-1]  # Реверсируем, чтобы оставить самый новый

            file_to_keep = files_with_mtime[0][0]

            # Удаляем остальные файлы
            for file_path, _ in files_with_mtime[1:]:
                try:
                    if not self.dry_run:
                        file_path.unlink()
                        removed_count += 1
                        logging.info(f"Удален дубликат: {file_path.name} (оригинал: {file_to_keep.name})")
                    else:
                        logging.info(
                            f"[DRY RUN] Был бы удален дубликат: {file_path.name} (оригинал: {file_to_keep.name})")
                except Exception as e:
                    logging.error(f"Не удалось удалить дубликат {file_path.name}: {e}")

        logging.info(f"Удалено дубликатов: {removed_count}")
        self.stats['duplicates_removed'] += removed_count

    def print_statistics(self):
        """Выводит статистику работы"""
        print("\n" + "=" * 60)
        print("СТАТИСТИКА ОРГАНИЗАЦИИ:")
        print("=" * 60)

        stats_items = [
            ("Обработано файлов", self.stats['processed']),
            ("Успешно перемещено", self.stats['moved']),
            ("Переименовано", self.stats['renamed']),
            ("Найдено дубликатов", self.stats['duplicates_found']),
            ("Удалено дубликатов", self.stats['duplicates_removed']),
            ("Пропущено", self.stats['skipped']),
            ("Ошибок", self.stats['errors'])
        ]

        for name, value in stats_items:
            print(f"{name:25} | {value:5}")

        if self.stats['processed'] > 0:
            success_rate = ((self.stats['moved'] + self.stats['duplicates_removed']) /
                            self.stats['processed']) * 100
            print(f"{'Успешно обработано:':25} | {success_rate:5.1f}%")

        print("=" * 60)

    def save_report(self, report_path: Optional[Path] = None):
        """Сохраняет отчет в JSON файл"""
        if report_path is None:
            report_path = self.source_folder / 'organization_report.json'

        report = {
            'timestamp': datetime.now().isoformat(),
            'source_folder': str(self.source_folder),
            'dry_run': self.dry_run,
            'statistics': self.stats,
            'categories': {k: len(v) for k, v in self.categories.items()}
        }

        if not self.dry_run:
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            logging.info(f"Отчет сохранен: {report_path}")


def main():
    """Основная функция"""
    setup_logging()

    print("🗂️  ОРГАНИЗАТОР ФАЙЛОВ")
    print("=" * 40)

    # Настройки
    source_folder = Path.home() / 'Downloads'
    print(f"Исходная папка: {source_folder}")

    # Проверяем существование папки
    if not source_folder.exists():
        print(f"❌ Папка не найдена: {source_folder}")
        return

    # Выбор режима
    dry_run_input = input("\nЗапустить в режиме предпросмотра? (y/n): ").lower()
    dry_run = dry_run_input == 'y'

    if dry_run:
        print("\n🔍 РЕЖИМ ПРЕДПРОСМОТРА - файлы не будут перемещены")

    # Выбор дополнительных опций
    remove_dups_input = input("\nИскать и удалять дубликаты? (y/n): ").lower()
    remove_duplicates = remove_dups_input == 'y'

    keep_oldest_input = input("При удалении дубликатов оставлять самую старую версию? (y/n): ").lower()
    keep_oldest = keep_oldest_input == 'y'

    # Создаем организатор
    organizer = FileOrganizer(source_folder, dry_run)

    print(f"\n{'=' * 40}")
    print("НАЧИНАЮ ОРГАНИЗАЦИЮ...")
    print(f"{'=' * 40}\n")

    # Запускаем организацию
    try:
        success = organizer.organize_files()

        if success and remove_duplicates:
            print("\n" + "=" * 40)
            print("ПОИСК И УДАЛЕНИЕ ДУБЛИКАТОВ...")
            print("=" * 40)
            organizer.remove_duplicates(keep_oldest)

        # Выводим статистику
        organizer.print_statistics()

        # Сохраняем отчет
        if not dry_run:
            organizer.save_report()

        print("\n" + "=" * 40)
        if dry_run:
            print("✅ ПРЕДПРОСМОТР ЗАВЕРШЕН")
            print("   Файлы не были перемещены.")
        else:
            print("✅ ОРГАНИЗАЦИЯ ЗАВЕРШЕНА")
            print(f"   Отчет сохранен: {source_folder / 'organization_report.json'}")
        print("=" * 40)

    except KeyboardInterrupt:
        print("\n\n⚠️  Операция прервана пользователем.")
    except Exception as e:
        print(f"\n❌ Произошла ошибка: {e}")
        logging.exception("Критическая ошибка:")


if __name__ == "__main__":
    main()