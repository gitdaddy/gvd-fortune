#include "beachline.hh"
#include "math.hh"
#include "utils.hh"
#include "nodeInsert.hh"

namespace
{
  bool isFlipped(vec2 p, vec2 b) // if p is the endpoint for seg.b
  {
    return math::equiv2(p, b);
  }

  static std::shared_ptr<Node> root = nullptr;
}

std::shared_ptr<vec2> intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, decimal_t directrix)
{
  std::vector<vec2> ints;
  auto left = math::createV(l->a, l->b, directrix, l->id);
  auto right = math::createV(r->a, r->b, directrix, r->id);
  ints = math::vvIntersect(right, left);
  if (ints.empty())
  {
    std::cout << "Empty intersections v-v\n";
    return nullptr;
  }

  if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
  if (ints.size() > 2)
  {
    // get the two ints that are closest to the x value of the left v
    // less than sorts
    std::sort(ints.begin(), ints.end(), [x = right.point.x](vec2 a, vec2 b) {
        return std::abs(x - a.x) < std::abs(x - b.x);
    });
    ints = {ints[0], ints[1]};
    std::sort(ints.begin(), ints.end(), [](vec2 a, vec2 b) { return a.x < b.x; });
  }
  auto centX = (ints[0].x + ints[1].x) / 2.0;
  auto prevY = f_x(left, centX);
  auto nextY = f_x(right, centX);
  auto lower = 1;
  if (prevY < nextY)
    lower = 0;
  return std::make_shared<vec2>(ints[1-lower]);
}

std::shared_ptr<vec2> intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r,
 bool isFlipped, decimal_t directrix)
{
  std::vector<vec2> ints;
  if (l->aType == ArcType_e::ARC_PARA)
  {
    auto left = math::createParabola(l->point, directrix, l->id);
    auto right = math::createV(r->a, r->b, directrix, r->id);
    ints = math::vpIntersect(right, left);
    if (ints.empty())
    {
      // use a back-up line since the parabola is probably
      // so narrow that it won't intersect with any ray below p
      if (math::equiv2(l->point, r->a) || math::equiv2(l->point, r->b) && left.p < 1e-5)
      {
        auto backupLine = math::createLine(vec2(-1, left.focus.x), vec2(1, left.focus.y));
        ints = math::vbIntersect(right, backupLine);
      }
      if (ints.empty())
      {
        std::cout << "0 intersections between p - v";
        return nullptr;
      }
    }
    if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
    if (ints.size() > 2)
    {
      auto x = l->aType == ArcType_e::ARC_PARA ? l->point.x : r->point.x;
      // Test get the center intersections
      ints = consolidate(ints, x);
      if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
    }

    auto idx = 0;
    auto centX = (ints[0].x + ints[1].x) / 2.0;
    auto prevY = math::parabola_f(centX, left.h, left.k, left.p);
    auto nextY = f_x(right, centX);
    auto lower = 1;
    if (prevY < nextY)
      lower = 0;
    idx = 1 - lower;

    if (isFlipped && math::equiv2(l->point, r->b)) idx = lower;
    return std::make_shared<vec2>(ints[idx]);
  }

  auto left = math::createV(l->a, l->b, directrix, l->id);
  auto right = math::createParabola(r->point, directrix, l->id);
  ints = math::vpIntersect(left, right);
  if (ints.empty())
  {
    // use a back-up line since the parabola is probably
    // so narrow that it won't intersect with any ray below p
    if (math::equiv2(r->point, l->a) || math::equiv2(r->point, l->b) && right.p < 1e-5)
    {
      auto backupLine = math::createLine(vec2(-1, right.focus.x), vec2(1, right.focus.y));
      ints = math::vbIntersect(left, backupLine);
    }
    if (ints.empty())
    {
      std::cout << "0 intersections between p - v";
      return nullptr;
    }
  }
  if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
  if (ints.size() > 2)
  {
    auto x = l->aType == ArcType_e::ARC_PARA ? r->point.x : r->point.x;
    // Test get the center intersections
    ints = consolidate(ints, x);
    if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
  }

  auto idx = 0;
  auto centX = (ints[0].x + ints[1].x) / 2.0;
  auto prevY = f_x(left, centX);
  auto nextY = math::parabola_f(centX, right.h, right.k, right.p);
  auto lower = 1;
  if (prevY < nextY)
    lower = 0;
  idx = 1 - lower;

  if (isFlipped && math::equiv2(l->point, l->b)) idx = lower;
  return std::make_shared<vec2>(ints[idx]);
}

std::shared_ptr<vec2> intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, decimal_t directrix)
{
  auto left = math::createParabola(l->point, directrix, l->id);
  auto right = math::createParabola(r->point, directrix, l->id);
  auto ints = math::ppIntersect(left.h, left.k, left.p, right.h, right.k, right.p);

  if (ints.empty()) throw std::runtime_error("Invalid intersection p-p");

  auto centX = (ints[0].x + ints[1].x) / 2.0;
  auto prevY = math::parabola_f(centX, left.h, left.k, left.p);
  auto nextY = math::parabola_f(centX, right.h, right.k, right.p);
  auto lower = 1;
  if (prevY < nextY)
    lower = 0;
  return std::make_shared<vec2>(ints[1-lower]);
}

std::shared_ptr<vec2> intersection(std::shared_ptr<Node> edge, decimal_t directrix)
{
  auto l = edge->prevArc();
  auto r = edge->nextArc();
  if (l->aType == ArcType_e::ARC_V && r->aType == ArcType_e::ARC_V)
    return intersectStraightArcs(l, r, directrix);
  else if (l->aType == ArcType_e::ARC_PARA && r->aType == ArcType_e::ARC_PARA)
    return intersectParabolicArcs(l, r, directrix);

  // if one is the endpoint of the other
  bool flipped = isFlipped(l->point, r->b) || isFlipped(r->point, l->b);
  return intersectParabolicToStraightArc(l, r, flipped, directrix);
}

std::vector<Event> add(std::shared_ptr<Node> const& pChild, EventPacket const& packet)
{
  auto arcNode = math::createArcNode(packet.site);
  auto directrix = packet.site.point.y;

  if (root == nullptr) 
  {
    auto subTreeData = generateSubTree(packet, arcNode, nullptr);
    root = subTreeData.root;
    return {};
  }

  auto parent = root;
  // var side, child;
  std::shared_ptr<Node> child;

  if (root->aType != ArcType_e::EDGE) 
  {
    child = root;
    auto subTreeData = generateSubTree(packet, arcNode, child);
    root = subTreeData.root;
    return {};
    // return processCloseEvents(subTreeData.nodesToClose, directrix);
  }

  // Do a binary search to find the arc node that the new
  // site intersects with
  auto rslt = intersection(parent, directrix);
  if (!rslt) throw std::runtime_error("Invalid intersection on add()");
  auto side = (packet.site.point.x < rslt->x) ? Side_e::LEFT : Side_e::RIGHT;
  child = math::getChild(parent, side);
  while (child->aType == ArcType_e::EDGE) 
  {
    parent = child;
    auto i = intersection(parent, directrix);
    if (!i) 
    {
      throw "Invalid intersection on 'Add'";
    } 
    // x = i.x;
    // if (packet.site[0] == x) {
    //   console.log("Site and intersect values equal:" + x + " for intersection: " + parent.id);
    // }
    side = (packet.site.point.x < i->x) ? Side_e::LEFT : Side_e::RIGHT;
    child = math::getChild(parent, side);
  }

  auto subTreeData = generateSubTree(packet, arcNode, child);
  math::setChild(parent, subTreeData.root, side);
  
  return {};
  // TODO
  // return processCloseEvents(subTreeData.nodesToClose, directrix);
}

std::vector<Event> remove(std::shared_ptr<Node> const& arcNode, vec2 point,
            double directrix, std::vector<std::shared_ptr<Node>> const& endingEdges)
{
  // if (!arcNode.isArc) throw "Unexpected edge in remove";

  auto parent = arcNode->pParent;
  auto grandparent = parent->pParent;
  auto side = (parent->pLeft && parent->pLeft->id == arcNode->id) ? Side_e::LEFT : Side_e::RIGHT;
  auto parentSide = (grandparent->pLeft->id == parent->id) ? Side_e::LEFT : Side_e::RIGHT;

  // Get newEdge (an EdgeNode) before updating children etc.
  auto newEdge = arcNode->nextEdge();
  if (side == Side_e::LEFT) {
    newEdge = arcNode->prevEdge();
  }

  auto siblingSide = side == Side_e::LEFT ? Side_e::RIGHT : Side_e::LEFT;
  auto sibling = math::getChild(parent, siblingSide);
  math::setChild(grandparent, sibling, parentSide);
  sibling->pParent = grandparent;

  // TODO update edge
  // newEdge.updateEdge(point, this.dcel, [], endingEdges);
  arcNode->live = false;

  // Cancel the close event for this arc and adjoining arcs.
  // Add new close events for adjoining arcs.
  // var closeEvents = [];
  std::vector<Event> closeEvents;
  auto prevArc = newEdge->prevArc();
  prevArc->live = false;
  auto e = createCloseEvent(prevArc, directrix);
  if (e)
    closeEvents.push_back(*e);

  auto nextArc = newEdge->nextArc();
  nextArc->live = false;
  e = createCloseEvent(nextArc, directrix);
  if (e)
    closeEvents.push_back(*e);
  return closeEvents;
}

