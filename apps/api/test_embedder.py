"""Quick test for the embedder service."""

from app.services.embedder import get_embedding, embed_chunks

print("=" * 50)
print("Testing Embedder")
print("=" * 50)

# Test 1: Single embedding
test_text = "A credit score is a prediction of your credit behavior."
print(f"\nTest text: {test_text}")

embedding = get_embedding(test_text)

print(f"\n✓ Embedding generated")
print(f"✓ Vector dimensions: {len(embedding)}")
print(f"✓ First 5 values: {embedding[:5]}")

# Test 2: Embed multiple chunks
print("\n" + "=" * 50)
print("Testing Chunk Embedding")
print("=" * 50)

chunks = [
    "Budgeting helps you track your income and expenses.",
    "Credit cards can build credit if used responsibly.",
    "Emergency funds should cover 3-6 months of expenses."
]

results = embed_chunks(chunks)

print(f"\n✓ Embedded {len(results)} chunks")
for r in results:
    print(f"  Chunk {r['chunk_index']}: {len(r['embedding'])} dimensions - \"{r['content'][:40]}...\"")
