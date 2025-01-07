const factory = require("./FactoryHandler");
const expressAsyncHandler = require("express-async-handler");
const FeatureApi = require("../Utils/Feature");
const createQuizModel = require("../Modules/createQuiz");
const createLecturesModel = require("../Modules/createAlecture");
const mongoose = require("mongoose");
// المدرس يضيف كويز جديد
exports.createQuiz = expressAsyncHandler(async (req, res) => {
  req.body.lecture = req.params.id;

  try {
    // إنشاء كويز جديد
    const newQuiz = new createQuizModel(req.body); // يمكن إضافة الأسئلة لاحقًا
    const savedQuiz = await newQuiz.save();
    await createLecturesModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: { quiz: savedQuiz._id },
      },
      { new: true }
    );
    res
      .status(201)
      .json({ message: "تم انشاء الاختبار بنجاح", quiz: savedQuiz });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

exports.getQuizzes = expressAsyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObject) {
    filter = req.filterObject;
  }

  const countDocs = await createQuizModel.countDocuments();
  const ApiFeatures = new FeatureApi(createQuizModel.find(filter), req.query)
    .Fillter(createQuizModel)
    .Sort()
    .Fields()
    .Search()
    .Paginate(countDocs);

  const { MongooseQueryApi, PaginateResult } = ApiFeatures;

  // استخدم projection لاستثناء correctAnswer
  const getDoc = await MongooseQueryApi.select({
    "questions.correctAnswer": 0,
  });
  res
    .status(200)
    .json({ results: getDoc.length, PaginateResult, data: getDoc });
});

exports.getQuizz = expressAsyncHandler(async (req, res) => {
  // استرجاع الكويز بناءً على المعرف
  const quiz = await createQuizModel
    .findById(req.params.id)
    .select(
      "-results -questions.correctAnswer -questions.answers.correctAnswer -questions.answers.correct"
    )
    .lean();

  // التحقق من وجود الكويز
  if (!quiz) {
    return res.status(404).json({ msg: "لا يوجد كويز بهذا المعرف" });
  }

  // إعداد معلومات الوقت
  const timeEntry = {
    user: req.user._id,
    startTime: Date.now(),
  };

  // التحقق مما إذا كان هناك إدخال موجود لهذا المستخدم
  const existingEntry = quiz.time.find(
    (entry) => entry.user.toString() === req.user._id.toString()
  );

  if (!existingEntry) {
    // إذا لم يكن هناك إدخال، أضف عنصر الوقت الجديد
    await createQuizModel.findByIdAndUpdate(
      req.params.id,
      { $push: { time: timeEntry } }, // استخدام $push لإضافة عنصر جديد إلى المصفوفة
      { new: true } // لإرجاع الكويز المحدث
    );
  } else {
    // إذا كان هناك إدخال موجود، يمكنك تحديثه إذا لزم الأمر
    const timeUpdates = {
      "time.$[elem].startTime": Date.now(),
    };

    await createQuizModel.findByIdAndUpdate(
      req.params.id,
      { $set: timeUpdates },
      { new: true, arrayFilters: [{ "elem.user": req.user._id }] }
    );
    // this.resumeQuiz;
  }

  // بعد تحديث الكويز، استرجع الكويز مرة أخرى للتأكد من احتوائه على البيانات المحدثة
  const updatedQuiz = await createQuizModel
    .findById(req.params.id)
    .select(
      "-results -questions.correctAnswer -questions.answers.correctAnswer -questions.answers.correct"
    )
    .lean();

  updatedQuiz.time = updatedQuiz.time.filter(
    (time) => time.user.toString() === req.user._id.toString()
  );

  // إرجاع الكويز مع معلومات الوقت
  return res.status(200).json({ data: updatedQuiz });
});

exports.getQuizAnswer = factory.getOne(createQuizModel);

exports.createQuestion = expressAsyncHandler(async (req, res) => {
  const { text, options, correctText, correctAnswer, image } = req.body;

  try {
    // إنشاء السؤال بناءً على النوع
    let newQuestion = {
      text,
      correctText,
      image,
    };

    newQuestion.options = options;
    newQuestion.correctAnswer = correctAnswer - 1; // تحديد الإجابة الصحيحة

    // تحديث الكويز بإضافة السؤال الجديد
    const quiz = await createQuizModel.findByIdAndUpdate(
      req.params.id,
      { $push: { questions: newQuestion } }, // إضافة السؤال الجديد لقائمة الأسئلة
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ msg: "الاختبار غير موجود" });
    }

    res.status(200).json({ msg: "تم اضافه السؤال بنجاح", quiz });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

exports.userAnswerchoice = expressAsyncHandler(async (req, res) => {
  const { questionId, selectedAnswer } = req.body;
  const userId = req.user._id;
  const quizId = req.params.id;

  try {
    // البحث عن الكويز والسؤال
    const quiz = await createQuizModel.findOne({
      _id: quizId,
      "questions._id": questionId,
    });

    if (!quiz) {
      return res
        .status(404)
        .json({ msg: "الاختبار أو السؤال غير موجوداوغير متاح" });
    }

    // تحقق مما إذا كان الطالب قد أجاب على جميع الأسئلة
    const allQuestionsAnswered = quiz.questions.every((q) =>
      q.answers.some((answer) => answer.user.toString() === userId.toString())
    );

    if (allQuestionsAnswered) {
      return res
        .status(403)
        .json({ message: "لا يمكنك تعديل الإجابات بعد الانتهاء من الاختبار" });
    }

    // العثور على السؤال
    const question = quiz.questions.id(questionId);
    const isCorrect = question.correctAnswer === selectedAnswer;
    const answerData = {
      user: userId,
      answer: question.options[selectedAnswer],
      correctAnswer: question.options[question.correctAnswer],
      correct: isCorrect,
    };

    // تحقق مما إذا كانت الإجابة موجودة بالفعل
    const existingAnswerIndex = question.answers.findIndex(
      (answer) => answer.user.toString() === userId.toString()
    );

    if (existingAnswerIndex !== -1) {
      // إذا كانت الإجابة موجودة، قم بتحديثها
      question.answers[existingAnswerIndex] = answerData;
    } else {
      // إذا لم تكن الإجابة موجودة، أضفها
      question.answers.push(answerData);
    }

    // حفظ التحديث
    await quiz.save();

    // تحقق مما إذا كان الطالب قد أجاب على جميع الأسئلة بعد التحديث
    const updatedAllQuestionsAnswered = quiz.questions.every((q) =>
      q.answers.some((answer) => answer.user.toString() === userId.toString())
    );

    if (updatedAllQuestionsAnswered) {
      // حساب النتائج
      let correctAnswers = 0;
      let incorrectAnswers = 0;

      quiz.questions.forEach((q) => {
        const userAnswer = q.answers.find(
          (answer) => answer.user.toString() === userId.toString()
        );
        if (userAnswer) {
          if (userAnswer.correct) {
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
        }
      });

      const totalQuestions = quiz.questions.length;
      const scorePercentage = (correctAnswers / totalQuestions) * 100;

      // إنشاء بيانات النتائج
      const resultData = {
        user: userId,
        correctAnswers,
        incorrectAnswers,
        scorePercentage,
        quizEnd: new Date(Date.now()),
      };

      // حفظ النتائج في الكويز (أو في جدول مستقل حسب التصميم الخاص بك)
      quiz.results.push(resultData);
      await quiz.save();

      return res.status(200).json({
        msg: "تم الانتهاء من الإجابة على جميع الأسئلة",
        resultData,
      });
    }

    res.status(200).json({ msg: "تم تسجيل الإجابة بنجاح", isCorrect });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في الخادم", error: error.message });
  }
});

exports.getQuestions = expressAsyncHandler(async (req, res) => {
  try {
    // البحث عن الكويز بناءً على المعرف وتحديد الحقول المطلوبة
    const quiz = await createQuizModel
      .findOne(
        { _id: req.params.id },
        {
          results: 0,
          time: 0,
          "questions.answers": 0,
          "questions.correctAnswer": 0,
          "questions.correctText": 0,
        }
      )
      .populate({ path: "lecture", select: "lecture price description" });

    if (!quiz) {
      return res.status(404).json({ msg: "لا يوجد كويز بهذا المعرف" });
    }

    // التحقق من أن req.user معرف
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ msg: "غير مصرح لك بالوصول إلى هذا المورد" });
    }

    // فلترة الإجابات بناءً على معرف المستخدم
    quiz.questions = quiz.questions.map((question) => {
      return {
        ...question,
        answers: Array.isArray(question.answers)
          ? question.answers.filter(
              (answer) =>
                answer.user &&
                answer.user.toString() === req.user._id.toString()
            )
          : [], // تأكد من أن answers مصفوفة قبل الفلترة
      };
    });

    return res.status(200).json({ data: quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "حدث خطأ أثناء جلب البيانات" });
  }
});

exports.getQuestion = expressAsyncHandler(async (req, res) => {
  const { id ,question} = req.params; 

console.log(req.params ) 
  try {
    // البحث عن الكويز وإرجاع السؤال المحدد فقط
    const quiz = await createQuizModel.findOne(
      { _id: id, "questions._id": question },
      { "questions.$": 1 } 
    );
    if (!quiz) {
      return res.status(404).json({ msg: "السؤال غير موجود" });
    }

    // استبعاد `correctAnswer` من السؤال
    const questionData = quiz.questions.map((question) => {
      const { correctAnswer, answers, ...questionWithoutCorrectAnswer } =
        question.toObject();
      return questionWithoutCorrectAnswer;
    });

    return res.status(200).json({ data: questionData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "حدث خطأ في الخادم", error });
  }
});

exports.getMyQuizs = expressAsyncHandler(async (req, res) => {
  let filter =
    req.user.role === "user"
      ? { user: req.user._id }
      : { user: new mongoose.Types.ObjectId(req.body.user) };
  const myQuiz = await createQuizModel
    .find({
      results: { $elemMatch: filter },
    })
    .select({ questions: 0, time: 0 })
    .populate({
      path: "lecture",
      select: { lecture: 1, section: 0 },
    });
  const scorePercentage = myQuiz
    .flatMap((q) => q.results)
    .filter((result) => result.user.toString() === filter.user.toString())
    .map((result) => result.scorePercentage);

  const maxScore = scorePercentage.length * 100;
  const totalScore = scorePercentage.reduce((acc, score) => acc + score, 0);
  const percentage = (totalScore / maxScore) * 100;

  res.status(200).json({
    status: "success",
    data: myQuiz,
    results: myQuiz.length,
    percentage,
  });
});

exports.getMyQuiz = expressAsyncHandler(async (req, res) => {
  try {
    let filter =
      req.user.role === "user"
        ? { user: req.user._id }
        : { user: new mongoose.Types.ObjectId(req.body.user) };

    const myQuiz = await createQuizModel
      .findOne({
        _id: req.params.id,
        results: { $elemMatch: filter },
      })
      .populate({
        path: "lecture",
        select: { lecture: 1, section: 0 },
      });

    if (!myQuiz) {
      return res.status(404).json({
        msg: "لا توجد كويز بهذا المعرف أو لا توجد نتائج للمستخدم. ربما بسبب عدم إكمال الاختبار.",
      });
    }

    // التحقق من وجود نتائج في myQuiz
    const result = myQuiz.results.find(
      (res) => res.user.toString() === filter.user.toString()
    );

    if (!result) {
      return res.status(404).json({
        msg: "لم يتم العثور على نتائج لهذا المستخدم في هذا الكويز.",
      });
    }

    // إرجاع بيانات الاختبار مع التفاصيل المطلوبة
    res.status(200).json({
      status: "success",
      data: myQuiz,
      questionLength: myQuiz.questions.length,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      percentage: result.scorePercentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "حدث خطأ في الخادم.",
      error: error.message,
    });
  }
});
exports.existQuiz = expressAsyncHandler(async (req, res) => {
  const quiz = await createQuizModel.findById(req.params.id).lean();

  if (!quiz) {
    return res
      .status(404)
      .json({ msg: "لم يتم العثور على الكويز لهذا المستخدم" });
  }

  const userId = req.user._id.toString();

  // إعداد الإحصاءات للنتائج
  let correctAnswers = 0;
  let incorrectAnswers = 0;

  quiz.questions = quiz.questions.map((question) => {
    // إيجاد إجابة المستخدم الحالية لهذا السؤال
    const userAnswer = question.answers.find(
      (answer) => answer.user && answer.user.toString() === userId
    );

    // إذا كان السؤال غير مجاب عنه من قبل الطالب، نعتبره إجابة خاطئة
    if (!userAnswer) {
      // إنشاء إجابة خاطئة افتراضية وإضافتها إلى السؤال
      const incorrectAnswer = {
        user: req.user._id,
        answer: null, // لا يوجد اختيار تم من قبل الطالب
        correctAnswer: question.options[question.correctAnswer],
        correct: false,
        graded: true,
      };
      question.answers.push(incorrectAnswer);
      incorrectAnswers += 1;
    } else {
      // حساب الإجابات الصحيحة والخاطئة بناءً على إجابة الطالب الموجودة
      if (userAnswer.correct) {
        correctAnswers += 1;
      } else {
        incorrectAnswers += 1;
      }
    }

    return question;
  });

  // حساب النتيجة النهائية
  const totalQuestions = quiz.questions.length;
  const scorePercentage = (correctAnswers / totalQuestions) * 100;

  // إضافة النتيجة إلى حقل `results` لهذا الطالب
  const resultEntry = {
    user: userId,
    correctAnswers,
    incorrectAnswers,
    scorePercentage,
    date: new Date(Date.now()),
    completed: true,
  };

  // تحديث الكويز بالنتيجة المضافة وإضافة الإجابات الخاطئة
  await createQuizModel.findByIdAndUpdate(
    req.params.id,
    {
      $push: { results: resultEntry },
      $set: { questions: quiz.questions },
    },
    { new: true }
  );

  // تصفية الوقت لعرض مدخلات المستخدم فقط
  quiz.time = quiz.time.filter(
    (entry) => entry.user && entry.user.toString() === userId
  );

  // تصفية النتائج لعرض نتائج المستخدم فقط
  quiz.results = quiz.results.filter(
    (entry) => entry.user && entry.user.toString() === userId
  );

  // إعادة الكويز مع النتيجة النهائية
  return res.status(200).json({
    data: quiz,
  });
});
exports.activeQuiz = expressAsyncHandler(async (req, res) => {
  const activeQuiz = await createQuizModel.findByIdAndUpdate(
    req.params.id,
    {
      $set: { active: true },
    },
    { new: true }
  );

  if (!activeQuiz) {
    return res
      .status(404)
      .json({ msg: "لم يتم العثور على الكويز لهذا المعرف" });
  }

  // إعادة الكويز مع النتيجة النهائية
  return res.status(200).json({
    status: "تم انشاء الاختبار بنجاح",
    data: activeQuiz,
  });
});
exports.updateQuiz = factory.updateOne(createQuizModel);
exports.deleteQuiz = factory.deleteOne(createQuizModel);
exports.updateQuestion = expressAsyncHandler(async (req, res, next) => {
  try {
    const { id, questionId } = req.params;
    const updatedData = req.body;

    // البحث عن الكويز
    const quiz = await createQuizModel.findById(id);

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "الاختبار غير موجود" });
    }

    // البحث عن السؤال داخل الكويز
    const question = quiz.questions.id(questionId);

    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "السؤال غير موجود" });
    }

    // تحديث الحقول مع الاحتفاظ بالقيمة القديمة في حالة undefined
    question.text =
      updatedData.text !== undefined ? updatedData.text : question.text;
    question.options =
      updatedData.options !== undefined
        ? updatedData.options
        : question.options;
    question.correctAnswer =
      updatedData.correctAnswer !== undefined
        ? updatedData.correctAnswer
        : question.correctAnswer;
    question.image =
      updatedData.image !== undefined ? updatedData.image : question.image;

    // حفظ التعديلات
    await quiz.save();

    res.json({ success: true, data: question });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "خطأ أثناء تحديث السؤال",
      error: error.message,
    });
  }
});

exports.deleteQuestion = expressAsyncHandler(async (req, res) => {
  const { id, questionId } = req.params;

  try {
    // البحث عن الكويز وحذف السؤال من المصفوفة باستخدام $pull
    const quiz = await createQuizModel.findByIdAndUpdate(
      id,
      { $pull: { questions: { _id: questionId } } },
      { new: true } // إرجاع النسخة المحدثة بعد الحذف
    );

    if (!quiz) {
      return res.status(404).json({ msg: "الاختبار غير موجود" });
    }

    return res.status(200).json({ status: "تم حذف السؤال بنجاح", data: quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "حدث خطأ في الخادم", error });
  }
});
