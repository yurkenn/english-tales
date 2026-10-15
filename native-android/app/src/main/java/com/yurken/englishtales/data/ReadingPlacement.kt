package com.yurken.englishtales.data

data class PlacementQuestion(
    val id: String,
    val level: String,
    val passage: String,
    val prompt: String,
    val options: List<String>,
    val correctOption: Int,
)

data class PlacementRecommendation(val level: String, val correctByLevel: Map<String, Int>)

/** A local reading starting-point suggestion, not a validated CEFR assessment. */
object ReadingPlacement {
    val levels = listOf("A1", "A2", "B1")
    val questions = listOf(
        PlacementQuestion("a1_be", "A1", "I ___ a student.", "", listOf("am", "is", "are"), 0),
        PlacementQuestion("a1_detail", "A1", "Maya has a blue bag. Her brother has a red bag.",
            "What colour is Maya's bag?", listOf("Red", "Blue", "Green"), 1),
        PlacementQuestion("a1_sequence", "A1", "Every morning, Sam eats breakfast before he goes to school.",
            "What does Sam do first?", listOf("Goes to school", "Goes to bed", "Eats breakfast"), 2),
        PlacementQuestion("a2_past", "A2", "Yesterday, we ___ to the park after lunch.", "",
            listOf("go", "went", "going"), 1),
        PlacementQuestion("a2_time", "A2", "The library closes at six. Nora arrives at half past five and needs twenty minutes to choose a book.",
            "Can Nora choose a book before it closes?",
            listOf("Yes, she has thirty minutes.", "No, it is already closed.", "No, she only has ten minutes."), 0),
        PlacementQuestion("a2_reason", "A2", "Leo wanted to walk to the station, but it started raining, so he took the bus.",
            "Why did Leo take the bus?", listOf("He missed the train.", "The station was closed.", "The weather changed."), 2),
        PlacementQuestion("b1_conditional", "B1", "If I had more free time, I ___ more often.", "",
            listOf("will read", "would read", "am reading"), 1),
        PlacementQuestion("b1_contrast", "B1", "Although the film received excellent reviews, Deniz found the ending predictable.",
            "How did Deniz probably feel?",
            listOf("He disliked every part of the film.", "He did not watch the ending.", "He was less impressed than the reviewers."), 2),
        PlacementQuestion("b1_inference", "B1", "Ella used to drive to work. Since the city introduced safer cycle lanes, she has left her car at home most weekdays.",
            "What can we infer?",
            listOf("Ella usually cycles to work now.", "Ella no longer works in the city.", "Ella drives more often than before."), 0),
    )

    /** -1 represents an explicit 'I don't know'; partial attempts never produce a result. */
    fun recommend(answers: List<Int>): PlacementRecommendation {
        require(answers.size == questions.size)
        require(answers.indices.all { answers[it] == -1 || answers[it] in questions[it].options.indices })
        val scores = levels.associateWith { level ->
            questions.indices.count { questions[it].level == level && answers[it] == questions[it].correctOption }
        }
        // Higher-level guesses cannot compensate for missing foundations.
        val level = if (scores.getValue("A1") < 2 || scores.getValue("A2") < 2) "A1"
            else if (scores.getValue("B1") < 2) "A2" else "B1"
        return PlacementRecommendation(level, scores)
    }
}
