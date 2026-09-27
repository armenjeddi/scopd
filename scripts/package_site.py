"""Package the explicit public-site allowlist using only the Python standard library."""

from pathlib import Path
import os
import stat
import sys
import tempfile
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "site-release.zip"

# Deliberately list every public asset. Never recursively archive the workspace.
# Add a new asset here only after reviewing it for public release.
PUBLIC_FILES = (
    "index.html",
    "styles.css",
    "script.js",
    "results.data.js",
    "site.config.js",
    ".nojekyll",
    "assets/favicon.svg",
    "assets/figures/representation-utilization-gap.png",
    "assets/figures/scopd-pipeline.png",
    "assets/figures/sensitivity-analysis.png",
    "assets/paper/scopd.pdf",
)


def checked_path(relative_name):
    """Reject missing files, indirect paths, and paths outside this workspace."""
    candidate = ROOT / relative_name
    try:
        candidate.resolve(strict=True).relative_to(ROOT)
    except FileNotFoundError:
        raise ValueError(f"Required public file is missing: {relative_name}") from None
    except ValueError:
        raise ValueError(f"Public file resolves outside the workspace: {relative_name}") from None

    for component in (candidate, *candidate.parents):
        if component == ROOT:
            break
        info = component.lstat()
        windows_reparse = getattr(info, "st_file_attributes", 0) & getattr(
            stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400
        )
        if component.is_symlink() or windows_reparse:
            raise ValueError(f"Public files must not use links or junctions: {relative_name}")

    if not candidate.is_file():
        raise ValueError(f"Required public path is not a regular file: {relative_name}")
    if candidate.stat().st_size == 0 and relative_name != ".nojekyll":
        raise ValueError(f"Required public file is empty: {relative_name}")
    return candidate


def main():
    staged_archive = None
    try:
        # Validate the entire list before creating or replacing the release.
        sources = [(name, checked_path(name)) for name in PUBLIC_FILES]
        with tempfile.NamedTemporaryFile(
            prefix=".site-release-", suffix=".zip", dir=ROOT, delete=False
        ) as temporary:
            staged_archive = Path(temporary.name)
        with ZipFile(staged_archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
            for relative_name, source in sources:
                archive.write(source, arcname=relative_name)
        os.replace(staged_archive, OUTPUT)
        staged_archive = None
    except (OSError, ValueError) as error:
        print(f"Packaging failed: {error}", file=sys.stderr)
        return 1
    finally:
        if staged_archive is not None:
            staged_archive.unlink(missing_ok=True)

    print(f"Created {OUTPUT}")
    print(f"Included {len(PUBLIC_FILES)} public files ({OUTPUT.stat().st_size:,} bytes).")
    print("Only the explicit public-file allowlist was included.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
