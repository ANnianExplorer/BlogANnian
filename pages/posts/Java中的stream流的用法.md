---
title: Java中的stream流的用法
date: 2026-05-04
tags:
  - Java
categories:
  - 技术
  - Java基础
cover: /BlogANnian/images/cover/stream.png
description: 在 java 中，涉及到对数组、集合等集合类元素的操作时，通常我们使用的是循环的方式进行逐个遍历处理，或者使用 stream 流的方式进行处理。
---

## Java中的stream流的用法

>在 java 中，涉及到对数组、集合等集合类元素的操作时，通常我们使用的是循环的方式进行逐个遍历处理，或者使用 stream 流的方式进行处理。

### 1、什么是 Stream？

>Stream 使用一种类似用 SQL 语句从数据库查询数据的直观方式来提供一种对 Java集合运算和表达的高阶抽象。StreamAPl可以极大提高Java程序员的生产力，让程序员写出高效率、干净、简洁的代码。这种风格将要处理的元素集合看作一种流，流在管道中传输，并且可以在管道的节点上进行处理，比如筛选，排序，聚合等。

### 2、创建 Stream 流

**stream()**    使用 stream() 创建串行流

```java
Stream<String> stream = stringList.stream();
```

**parallelStream() **  使用 parallelStream() 创建并行流

```java
Stream<String> stringStream = stringList.parallelStream();
```

**通过Stream创建流**

可以使用Stream类提供的方法，直接返回一个由指定元素组成的流。

```java
Stream<String> stream = Stream.of("Hello", "HelloWorld", "World");
```

如以上代码，直接通过of方法，创建并返回一个Stream

### 3、Stream 流常用操作

负责对Stream进行处理操作，并返回一个新的Stream对象，中间管道操作可以进行**叠加**。

`用的都是Hutool工具类ObjectUtil、JSONUtil`

**forEach** forEach来迭代流中的每个数据,输出所有元素

```java
stringList.forEach(System.out::println);
```

**map** 用于映射每个元素到对应的结果，将流中的每一个元素T映射为R，将已有元素转换为另一个对象类型，一对一逻辑，返回新的stream流，保持嵌套结构

```java
List<Long> list = stringList.stream()
                .map(size -> ((Number) size).longValue())
                .toList();
```

**filter** filter是过滤操作，返回结果为true的数据；

```java
List<String> Lists = oldList.stream()
                .filter(obj -> ObjectUtil.isNotNull(obj))
  							.toList();
// :: 是一种方法引用，它可以将一个方法引用转换为一个Lambda表达式，这里的ObjectUtil::isNotNull就是一个方法引用，等价于 obj -> ObjectUtil.isNotNull(obj)
List<String> Lists = oldList.stream()
                .filter(ObjectUtil::isNotNull)
                .map(Object::toString)
                .toList();
```

**flatMap **将已有元素转换为另一个对象类型，一对多逻辑，即原来一个元素对象可能会转换为1个或者多个新类型的元素，返回新的stream流

```
一个元素变成多个元素（集合的扁平化）
```

```java
Map<String, Long> tagCountMap = tagsLists.stream()
                // 将每个JSON字符串 "[标签1,标签2]" 展开成多个标签
 								// "[标签1,标签2,标签3]", "[标签1,标签2,标签3]" ==> "标签1","标签2","标签3","标签1","标签2","标签3"
                .flatMap(tags -> (JSONUtil.toList(tags, String.class)).stream())
```

```
嵌套集合扁平化
```

```java
List<List<String>> nestedList = Arrays.asList(
    Arrays.asList("a", "b"),
    Arrays.asList("c", "d")
);

// flatMap 将 List<List<String>> 转为 List<String>
List<String> flatList = nestedList.stream()
    .flatMap(List::stream)
    .toList();
// 结果: ["a", "b", "c", "d"]
```

```
Optional 去空值
```

```java
List<Optional<String>> optionals = Arrays.asList(
    Optional.of("hello"),
    Optional.empty(),
    Optional.of("world")
);

List<String> result = optionals.stream()
    .flatMap(opt -> opt.stream())  // 自动过滤掉 empty
    .toList();
// 结果: ["hello", "world"]

```

```
Map 的键值对展开
```

```java
Map<String, List<String>> map = Map.of(
    "fruits", Arrays.asList("apple", "banana"),
    "vegetables", Arrays.asList("carrot", "tomato")
);

// 将所有列表的值展开
List<String> allItems = map.values().stream()
    .flatMap(List::stream)
    .toList();
// 结果: ["apple", "banana", "carrot", "tomato"]

```

```
条件过滤 + 展开组合
```

```java
List<String> sentences = Arrays.asList(
                "hello world",
                "java stream",
                "flat map"
        );

// 只展开长度大于5的句子的单词
        List<String> words = sentences.stream()
                .flatMap(s -> Arrays.stream(s.split(" ")))
                .filter(s -> s.length() > 5)
                .toList();
// 结果: ["stream"]
```

![image-20260504171309874](/images/image-20260504171309874.png)



**mapToLong**（也适应其他格式：mapToDouble等）

```java
long count = list.stream()
                    .mapToLong(obj -> (Long) obj) // 将Object转换为Long
                    .sum();// 计算总使用大小
```

**limit ** 获取指定数量的流

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7);
numbers.stream().limit(3).forEach(System.out::println); //1, 2, 3
```

imit 返回 Stream 的前面n个元素；skip 则是扔掉前 n个元素

**skip ** 扔掉前 n个元素

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7);
numbers.stream().skip(3).forEach(System.out::println); // 4, 5, 6, 7
```

**distinct**  去重

```java
List<Integer> numbers = Arrays.asList(4, 2, 3, 4, 5, 6, 4);
numbers.stream().distinct.forEach(System.out::println); // 4, 2, 3, 5, 6
```

**sortd**  sorted 方法用于对流进行排序

```java
List<Integer> numbers = Arrays.asList(7, 2, 6, 4, 5, 3, 1);
numbers.stream().sorted().forEach(System.out::println); //1, 2, 3, 4, 5, 6, 7 默认升序
```

**sorted(Comparator com)**  添加判断方法

```java
.stream().sorted(Comparator.comparing(Integer::intValue));
// 降序排序
.stream().sorted(Comparator.comparing(Integer::intValue).reversed());

//==================================================================
Map<String, Long> countMap = new HashMap<>();
countMap.put("a", 5L);
countMap.put("b", 6L);
countMap.put("c", 1L);
countMap.put("d", 9L);
countMap.
  .entrySet()// 键值对视图，Map 没有实现 Streamable 接口，需要先转换为 Collection【keySet（只需要键）values（只需要值）entrySet（最常用，同时访问键和值）】
  .stream()
  .sorted((entry1, entry2) 
          -> Long.compare(
                  entry2.getValue(),
                  entry1.getValue()// 先2后1，降序排列
                )
           )
  .forEach(System.out::println);
// d,b,a,c
```

**peek ** 主要用于调试

peek = 偷看：查看流中数据但不修改
必须配合终端操作，否则不会执行，也就是peek后面得有结束操作.toList()等
主要用于调试，不要用它替代 map：peek 不应该改变数据

```java
.stream()
    .peek(map -> log.debug("原始数据: {}", map))  // 调试日志
    .map(res -> res + 1)
    .peek(response -> log.debug("转换结果: {}", response))  // 调试日志
    .toList();
```

![image-20260504171309874](/images/image-20260504164204024.png)



### 4、Collectors 收集器

![image-20260504171309874](/images/image-20260504180226674.png)

Stream结果收集操作的本质，其实**就是将Stream中的元素通过收集器定义的函数处理逻辑进行加工，然后输出加工后的结果**

Collectors工具类通过的Collector实现类

| 方法              | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| toList            | 将流中的元素收集到一个 List 中                               |
| toSet             | 将流中的元素收集到一个 Set 中                                |
| toCollection      | 将流中的元素收集到一个 Collection 中                         |
| toMap             | 将流中的元素映射收集到一个 Map 中                            |
| counting          | 统计流中的元素个数                                           |
| summingInt        | 计算流中指定 int 字段的累加和。针对不同类型的数字类型，有不同的方法，比如 summingDouble 等 |
| averagingInt      | 计算流中指定 int 字段的平均值。针对不同类型的数字类型，有不同的方法，比如 averagingLong 等 |
| joining           | 将流中所有元素（或者元素的指定字段）字符串值进行拼接，可以指定拼接连接符，或者首尾拼接字符 |
| maxBy             | 根据给定的比较器，选择出值最大的元素                         |
| minBy             | 根据给定的比较器，选择出值最小的元素                         |
| groupingBy        | 根据给定的分组函数的值进行分组，输出一个 Map 对象            |
| partitioningBy    | 根据给定的分区函数的值进行分区，输出一个 Map 对象，且 key 始终为布尔值类型 |
| collectingAndThen | 包裹另一个收集器，对其结果进行二次加工转换                   |
| reducing          | 从给定的初始值开始，将元素进行逐个处理，最终将所有元素计算为最终的 1 个值输出 |

**恒等处理 Collectors**

所谓恒等处理，指的就是Stream的元素在经过Collector函数处理前后完全不变，例如toList()操作，只是最终将结果从Stream中取出放入到List对象中，并没有对元素本身做任何的更改处理

>toList() 是新规范 Java 16+

![image-20260504180048869](/images/image-20260504180048869.png)

**分组 Collectors**   分组

>`groupingBy()`操作需要指定两个关键输入，即**分组函数**和**值收集器**：
>
>- 分组函数：一个处理函数，用于基于指定的元素进行处理，返回一个用于分组的值（即分组结果HashMap的Key值），对于经过此函数处理后返回值相同的元素，将被分配到同一个组里。
>- 值收集器：对于分组后的数据元素的进一步处理转换逻辑，此处还是一个常规的Collector收集器，和collect()方法中传入的收集器完全等同（可以想想俄罗斯套娃，一个概念）。
>
>对于`groupingBy`分组操作而言，分组函数与值收集器二者必不可少。为了方便使用，在Collectors工具类中，提供了两个`groupingBy`重载实现，其中有一个方法只需要传入一个分组函数即可，这是因为其默认使用了toList()作为值收集器

```java
// 常规分组可以仅传入一个分组函数
Map<String, List<String>> tagCountMap = tagsLists.stream()
                // "标签1","标签2","标签3","标签1","标签2","标签3"
                // 使用Collectors.groupingBy()方法进行分组，并使用Collectors.counting()方法进行计数
                .collect(Collectors.groupingBy(tag -> tag));
/* 结果：
{
  标签1=[标签1, 标签1],
  标签2=[标签2, 标签2],
  标签3=[标签3, 标签3]
}
**/
// =================================================
// 如果需要对数据额外处理，就可以传入分组函数，比如下面的计数
Map<String, Long> tagCountMap = tagsLists.stream()
                // "标签1","标签2","标签3","标签1","标签2","标签3"
                // 使用Collectors.groupingBy()方法进行分组，并使用Collectors.counting()方法进行计数
                .collect(Collectors.groupingBy(tag -> tag, Collectors.counting()));
// 结果：{标签1=2, 标签2=2, 标签3=2}
// =================================================
/**
* key类型仅为布尔值
* 通过Collectors.partitioningBy()提供的分区收集器来实现
**/
Map<Boolean, Long> tagCountMap = tagsLists.stream()
                // "标签1","标签2","标签3","标签1","标签2","标签3",""
                // 使用Collectors.groupingBy()方法进行分组，并使用Collectors.counting()方法进行计数
                .collect(Collectors.partitioningBy(
                		tag -> StrUtil.isNotBlank(tag),
                  	Collectors.counting()
                ));
// 结果：{false=1, true=6}
```



**归约汇总 Collectors**  终止管道

通过终止管道操作之后，Stream流将**会结束**，最后可能会执行某些逻辑处理，或者是按照要求返回某些执行后的结果数据。对于归约汇总类的操作，Stream流中的元素逐个遍历，进入到Collector处理函数中，然后会与上一个元素的处理结果进行合并处理，并得到一个新的结果，以此类推，直到遍历完成后，输出最终的结果

| API         | 功能说明                                                     |
| ----------- | ------------------------------------------------------------ |
| count()     | 返回 stream 处理后最终的元素个数                             |
| max()       | 返回 stream 处理后的元素最大值                               |
| min()       | 返回 stream 处理后的元素最小值                               |
| findFirst() | 找到第一个符合条件的元素时则终止流处理                       |
| findAny()   | 找到任何一个符合条件的元素时则退出流处理，这个对于串行流时与 findFirst 相同，对于并行流时比较高效，任何分片中找到都会终止后续计算逻辑 |
| anyMatch()  | 返回一个 boolean 值，类似于 isContains (), 用于判断是否有符合条件的元素 |
| allMatch()  | 返回一个 boolean 值，用于判断是否所有元素都符合条件          |
| noneMatch() | 返回一个 boolean 值，用于判断是否所有元素都不符合条件        |
| collect()   | 将流转换为指定的类型，通过 Collectors 进行指定               |
| toArray()   | 将流转换为数组                                               |
| iterator()  | 将流转换为 Iterator 对象                                     |
| foreach()   | 无返回值，对元素进行逐个遍历，然后执行给定的处理逻辑         |

>这里需要补充提醒下，**一旦一个Stream被执行了终止操作之后，后续便不可以再读这个流执行其他的操作**了，否则会报错

### 5、总结

Stream API 的优势，相比于传统的开发方式

- 简洁性和可读性：代码更简洁，避免了显式的循环。
- 函数式编程支持：通过高阶函数提供更高的灵活性和可重用性。
- 并行处理：轻松使用 parallelStream() 实现并行处理，提高性能。
- 惰性计算和延迟求值：避免不必要的计算，提高性能。
- 丰富的聚合和转换功能：提供强大的数据聚合、转换、过滤等功能。
- 函数式思维：鼓励不修改数据的不可变式操作。

**参考**

https://juejin.cn/post/7118991438448164878

https://www.cnblogs.com/softwarearch/p/16490440.html

https://www.yuque.com/xiaoheizuan/txpysq/lsopxqxn191f6k0z

https://blog.csdn.net/2303_80195175/article/details/154076110