"""
Text chunker using LangChain's RecursiveCharacterTextSplitter.
Splits article content into smaller chunks for storage and future RAG.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter


# Default chunking settings
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:
    """
    Split text into chunks.
    
    Args:
        text: The text to split
        chunk_size: Maximum size of each chunk (default 1000 characters)
        chunk_overlap: Overlap between chunks (default 200 characters)
        
    Returns:
        List of text chunks
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    
    chunks = splitter.split_text(text)
    return chunks
