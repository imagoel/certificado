import re


NAME_CONNECTORS = {"da", "das", "de", "do", "dos", "e"}


def _capitalize_name_piece(piece: str) -> str:
    if not piece:
        return piece
    lower = piece.lower()
    return f"{lower[0].upper()}{lower[1:]}"


def _format_name_word(word: str, index: int) -> str:
    lower_word = word.lower()
    if index > 0 and lower_word in NAME_CONNECTORS:
        return lower_word

    hyphen_parts = re.split(r"(-)", word)
    formatted_hyphen_parts: list[str] = []
    for hyphen_part in hyphen_parts:
        if hyphen_part == "-":
            formatted_hyphen_parts.append(hyphen_part)
            continue

        apostrophe_parts = re.split(r"(')", hyphen_part)
        formatted_apostrophe_parts = [
            part if part == "'" else _capitalize_name_piece(part)
            for part in apostrophe_parts
        ]
        formatted_hyphen_parts.append("".join(formatted_apostrophe_parts))

    return "".join(formatted_hyphen_parts)


def normalize_participant_name(value: str | None) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    text = text.strip(" -.,;:")
    if not text:
        return ""

    words = text.split(" ")
    return " ".join(_format_name_word(word, index) for index, word in enumerate(words))
